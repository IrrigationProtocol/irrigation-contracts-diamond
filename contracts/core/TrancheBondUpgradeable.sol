// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC1155Upgradeable.sol";

import "./TrancheBondStorage.sol";
import "./WaterCommonStorage.sol";
import "./WaterTowerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../libraries/Constants.sol";
import "../libraries/PodTransferHelper.sol";

import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/IERC1155WhitelistUpgradeable.sol";
import "../interfaces/IBeanstalkPrice.sol";

// import "hardhat/console.sol";

/// @title  TrancheBond Contract
/// @notice Allows users deposit underlying assets like pods,
///         create tranche and receive underlying assets with tranche
/// @dev    users receive 3 tranche nfts(ERC1155) after deposit underlying assets.
///         tranche A and Tranche B nft holders can list hold nfts on our auction market.
///         users can set maturity date when creating tranche,
///         and after tranche is mature, can receive underlying assets with tranche

contract TrancheBondUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using TrancheBondStorage for TrancheBondStorage.Layout;
    using WaterTowerStorage for WaterTowerStorage.Layout;

    uint256 public constant FMV_DENOMINATOR = 100;
    uint256 public constant MINIMUM_FMV = 1000;
    uint256 public constant MINIMUM_WATER = 32;
    // default maturity period
    uint256 public constant MATURITY_PERIOD = 180 days;

    /// @dev Events
    event CreateTranche(uint depositIndex, uint totalFMV, uint depositedAt, uint beanPrice);
    event ReceivePodsWithTranche(uint trancheId, uint[] podIndexes, uint totalPods);

    /// @dev Errors
    // errors for tranche pods
    error InvalidPods();
    error NotTranchePods();
    error InsufficientPods();

    // errors for general tranche
    error NotOwnerOfTranche();
    error NotMatureTranche();

    // errors for farmer's market rule
    error NotEligible();

    /// @notice Create tranches by depositing group of pods
    /// @dev See transferPlot function in https://github.com/BeanstalkFarms/Beanstalk/blob/master/protocol/contracts/farm/facets/MarketplaceFacet/MarketplaceFacet.sol
    /// @param indexes Index array of deposited pods
    /// @param starts Array of start number for deposited pods
    /// @param ends Array of end number for deposited pods
    /// @param maturityPeriod Maturity Period, if this is 0, default is 180 days

    function createTranchesWithPods(
        uint256[] calldata indexes,
        uint256[] calldata starts,
        uint256[] calldata ends,
        uint256 maturityPeriod
    ) external onlyWaterHolder {
        if (indexes.length != starts.length || indexes.length != ends.length) revert InvalidPods();
        uint256[] memory podIndexes = new uint256[](indexes.length);
        uint256[] memory amounts = new uint256[](indexes.length);
        uint256[] memory fmvs = new uint256[](indexes.length);

        /// @dev sum of FMVs for all deposited plots
        uint256 totalFMV;
        uint256 totalPods;
        // calculate directly price with 6 decimals from beanstalk
        uint256 beanPrice = IBeanstalkPrice(Constants.BEANSTALK_PRICE).price().price;
        for (uint256 i; i < indexes.length; ) {
            uint256 _index = indexes[i];
            uint256 _start = starts[i];
            uint256 _end = ends[i];
            WaterCommonStorage.layout().beanstalk.transferPlot(
                msg.sender,
                address(this),
                _index,
                _start,
                _end
            );
            /// checked inside of transferPlot function
            uint256 amount;
            uint256 id;
            unchecked {
                id = _index + _start;
                podIndexes[i] = id;
                amount = _end - _start;
                amounts[i] = amount;
            }
            totalPods += amount;
            /// @dev we calculate fmv in usd
            uint256 _fmvInPlot = (IPodsOracleUpgradeable(address(this)).latestPriceOfPods(
                id,
                amount
            ) * beanPrice) / 1e18;
            fmvs[i] = _fmvInPlot;
            totalFMV += _fmvInPlot;
            unchecked {
                ++i;
            }
        }
        if (totalFMV < MINIMUM_FMV) revert InvalidPods();
        uint256 curDepositCount = TrancheBondStorage.layout().curDepositCount + 1;
        /// Register deposited plot
        TrancheBondStorage.layout().depositedPods[curDepositCount].podIndexes = podIndexes;
        TrancheBondStorage.layout().depositedPods[curDepositCount].amounts = amounts;
        TrancheBondStorage.layout().depositedPods[curDepositCount].totalFMV = totalFMV;
        TrancheBondStorage.layout().depositedPods[curDepositCount].fmvs = fmvs;

        /// Create underlying asset meta data
        TrancheBondStorage.layout().underlyingAssets[curDepositCount] = UnderlyingAssetMetadata({
            contractAddress: Constants.ZERO,
            assetType: UnderlyingAssetType.PODS,
            maturityDate: uint64(
                block.timestamp + (maturityPeriod == 0 ? MATURITY_PERIOD : maturityPeriod)
            ),
            totalDeposited: totalPods
        });

        /// Create tranche A, B, Z
        _createTranchesFromDeposit(curDepositCount, totalFMV, msg.sender);
        TrancheBondStorage.layout().curDepositCount = curDepositCount;
        emit CreateTranche(curDepositCount, totalFMV, block.timestamp, beanPrice);
    }

    /// @dev receive pods with tranches after maturity date is over
    function receivePodsForTranche(uint256 trancheId) external {
        uint256[3] memory offsetFMVs = [uint256(0), 20, 50];
        (uint256 depositId, uint8 trancheLevel) = getTrancheInfo(trancheId);
        DepositPods memory depositPlots = TrancheBondStorage.layout().depositedPods[depositId];
        UnderlyingAssetMetadata memory underlyingAsset = TrancheBondStorage
            .layout()
            .underlyingAssets[depositId];
        if (underlyingAsset.assetType != UnderlyingAssetType.PODS) revert NotTranchePods();
        if (block.timestamp < underlyingAsset.maturityDate) revert NotMatureTranche();

        ///@dev plot for tranche is correspond to [offsetFMV + claimedFMV, offsetFMV + claimedFMV + userFMV]
        uint256 claimedFMV = TrancheBondStorage.layout().tranches[trancheId].claimedFMV;
        uint256 offsetFMV = (offsetFMVs[trancheLevel] * depositPlots.totalFMV) /
            FMV_DENOMINATOR +
            TrancheBondStorage.layout().tranches[trancheId].claimedFMV;
        uint256 fmv = IERC1155Upgradeable(address(this)).balanceOf(msg.sender, trancheId);
        if (fmv < MINIMUM_FMV) revert InsufficientPods();
        // uint256 podlineCount = depositPlots.podIndexes.length;
        uint256 startIndex = depositPlots.startIndexAndOffsets[trancheLevel];
        uint256 startOffset = depositPlots.startIndexAndOffsets[trancheLevel + 3];
        // uint256 startIndex = depositPlots.curStarts[trancheLevel];
        uint256 startIndexForSeniorLevel = trancheLevel == 0
            ? 0
            : depositPlots.startIndexAndOffsets[trancheLevel - 1];
        uint256 startOffsetForSeniorLevel = trancheLevel == 0
            ? 0
            : depositPlots.startIndexAndOffsets[trancheLevel + 2];

        // uint256[] memory receivePodIndexes = new uint256[](depositPlots.podIndexes.length);

        for (uint256 i; i < depositPlots.podIndexes.length; ) {
            if (fmv == 0) break;
            DepositPods memory _depositPlots = depositPlots;
            // uint256 podsForEachPlot = _depositPlots.amounts[i];
            uint256 fmvForEachPlot = _depositPlots.fmvs[i];

            uint256 _fmv = fmv;
            /// if plot for the tranche is placed in this range
            uint256 _offsetFMV = offsetFMV;
            if (fmvForEachPlot >= _offsetFMV) {
                uint256 originalPodIndex = _depositPlots.podIndexes[i];
                // uint256 start;
                uint256 realPodIndex;
                (uint256 start, uint256 amount, uint256 reserveFMV) = PodTransferHelper
                    .getPlotSplittedByFMV(
                        _depositPlots.amounts[i],
                        fmvForEachPlot,
                        _offsetFMV,
                        _fmv
                    );
                if (startOffset != 0 && startIndex == i) {
                    realPodIndex = originalPodIndex + startOffset;
                    start = 0;
                } else if (startOffsetForSeniorLevel != 0 && startIndexForSeniorLevel == i) {
                    realPodIndex = originalPodIndex + startOffsetForSeniorLevel;
                    start -= startOffsetForSeniorLevel;
                } else {
                    realPodIndex = originalPodIndex;
                }                
                WaterCommonStorage.layout().beanstalk.transferPlot(
                    address(this),
                    msg.sender,
                    realPodIndex,
                    start,
                    amount + start
                );
                // receivePodIndexes[i] = realPodIndex + start;                
                fmv = reserveFMV;
                startIndex = i;
                startOffset = realPodIndex + start + amount - originalPodIndex;
                // offset is 0 from next podline
                offsetFMV = 0;
            } else {
                offsetFMV -= fmvForEachPlot;
            }
            unchecked {
                i++;
            }
        }
        // update startIndex and startOffset for current tranche pods
        TrancheBondStorage.layout().depositedPods[depositId].startIndexAndOffsets[
            trancheLevel
        ] = uint128(startIndex);
        TrancheBondStorage.layout().depositedPods[depositId].startIndexAndOffsets[
            trancheLevel + 3
        ] = uint128(startOffset);
        {
            uint256 _trancheId = trancheId;
            TrancheBondStorage.layout().tranches[_trancheId].claimedFMV = claimedFMV - fmv;
            IERC1155WhitelistUpgradeable(address(this)).burnTotalAmount(msg.sender, _trancheId);
            // emit ReceivePodsWithTranche(_trancheId, receivePodIndexes, 0);
        }
    }

    function _createTranchesFromDeposit(
        uint256 depositId,
        uint256 totalFMVInUSD,
        address owner
    ) internal {
        uint256[3] memory numeratorFMV = [uint256(20), 30, 50];
        uint256 trancheAId = (depositId << 2) + 1;
        for (uint256 i = 0; i < 3; ) {
            uint256 trancheId = trancheAId + i;
            uint256 fmv = (totalFMVInUSD * numeratorFMV[i]) / FMV_DENOMINATOR;
            TrancheBondStorage.layout().tranches[trancheId] = TrancheMetadata({
                fmv: fmv,
                claimedAmount: 0,
                claimedFMV: 0
            });

            /// mint tranche nft with trancheId and totalSupply
            IERC1155WhitelistUpgradeable(address(this)).mint(owner, trancheId, fmv, "");
            unchecked {
                ++i;
            }
        }
    }

    /// @dev get functioins
    function getTranchePods(
        uint256 trancheId
    )
        public
        view
        returns (
            TrancheMetadata memory tranche,
            DepositPods memory depositPods,
            UnderlyingAssetMetadata memory underlyingAsset
        )
    {
        uint256 depositId = trancheId >> 2;
        tranche = TrancheBondStorage.layout().tranches[trancheId];
        underlyingAsset = TrancheBondStorage.layout().underlyingAssets[depositId];
        depositPods = TrancheBondStorage.layout().depositedPods[depositId];
    }

    /// @notice return offset and pods to calculate how much pods users can receive
    /// @param trancheId tranche nft id
    /// @param user user address
    /// @return offset start offset of total pods
    /// @return pods pods amount available for the user
    function getAvailablePodsForUser(
        uint256 trancheId,
        address user
    ) public view returns (uint256 offset, uint256 pods) {
        uint256[3] memory numeratorFMV = [uint256(20), 30, 50];
        uint256[3] memory startIndexPercent = [uint256(0), 20, 50];
        (uint256 depositId, uint8 trancheLevel) = getTrancheInfo(trancheId);
        TrancheMetadata memory tranche = TrancheBondStorage.layout().tranches[trancheId];
        UnderlyingAssetMetadata memory underlyingAsset = TrancheBondStorage
            .layout()
            .underlyingAssets[depositId];
        uint256 podsForTranche = (underlyingAsset.totalDeposited * numeratorFMV[trancheLevel]) /
            FMV_DENOMINATOR;
        pods = user == Constants.ZERO
            ? podsForTranche
            : ((podsForTranche * IERC1155Upgradeable(address(this)).balanceOf(user, trancheId)) /
                tranche.fmv);
        if (pods == 0) return (0, 0);
        offset =
            (startIndexPercent[trancheLevel] * underlyingAsset.totalDeposited) /
            FMV_DENOMINATOR +
            tranche.claimedAmount;
    }

    function getPlotsForTranche(
        uint256 trancheId
    ) external view returns (uint256[] memory starts, uint256[] memory podAmounts) {
        uint256 trancheFMV = TrancheBondStorage.layout().tranches[trancheId].fmv;
        return _plotsForTranche(trancheId, trancheFMV, 0);
    }

    /// @notice return start pod indexes and pod amounts to calculate how much pods users can receive
    /// @param trancheId tranche nft id
    /// @return starts start ids in podlines
    /// @return podAmounts pods in podlines

    function _plotsForTranche(
        uint256 trancheId,
        uint256 userFMV,
        uint256 claimedFMV
    ) internal view returns (uint256[] memory starts, uint256[] memory podAmounts) {
        uint256[3] memory offsetFMVs = [uint256(0), 20, 50];
        (uint256 depositId, uint8 trancheLevel) = getTrancheInfo(trancheId);
        DepositPods memory depositPlots = TrancheBondStorage.layout().depositedPods[depositId];
        ///@dev plot for tranche is correspond to [offsetFMV + claimedFMV, offsetFMV + claimedFMV + userFMV]
        uint256 offsetFMV = (offsetFMVs[trancheLevel] * depositPlots.totalFMV) /
            FMV_DENOMINATOR +
            claimedFMV;
        uint256 fmv = userFMV;
        uint256 podlineCount = depositPlots.podIndexes.length;
        starts = new uint256[](podlineCount);
        podAmounts = new uint256[](podlineCount);
        for (uint256 i; i < podlineCount; ) {
            if (fmv == 0) break;
            uint256 podsForEachPlot = depositPlots.amounts[i];
            uint256 fmvForEachPlot = depositPlots.fmvs[i];
            /// if plot for the tranche is placed in this range
            if (fmvForEachPlot >= offsetFMV) {
                (uint256 start, uint256 amount, uint256 reserveFMV) = PodTransferHelper
                    .getPlotSplittedByFMV(podsForEachPlot, fmvForEachPlot, offsetFMV, fmv);
                starts[i] = start;
                podAmounts[i] = amount;
                fmv = reserveFMV;
                offsetFMV = 0;
            } else {
                offsetFMV -= fmvForEachPlot;
            }
            unchecked {
                i++;
            }
        }
    }

    function getFMV(uint256 trancheId) external view returns (uint256) {
        return TrancheBondStorage.layout().tranches[trancheId].fmv;
    }

    /// @dev deposit Id
    /// @param trancheId tranche Id
    /// @return depositId deposit Id
    /// @return trancheLevel tranche level number
    function getTrancheInfo(
        uint256 trancheId
    ) public pure returns (uint256 depositId, uint8 trancheLevel) {
        return (trancheId >> 2, uint8(trancheId & 3) - 1);
    }

    /// @dev modifiers
    modifier onlyWaterHolder() {
        if (WaterTowerStorage.userInfo(msg.sender).amount < MINIMUM_WATER * 1e18)
            revert NotEligible();
        _;
    }
}
