// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TrancheBondStorage.sol";
// import "./TrancheNotationStorage.sol";
import "./WaterCommonStorage.sol";
import "./WaterTowerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../libraries/Constants.sol";

import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/ITrancheNotationUpgradeable.sol";
import "../interfaces/IPriceOracleUpgradeable.sol";

/// @title TrancheBond Contract
/// @dev Allows users deposit pods and receive tranches

contract TrancheBondUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using TrancheBondStorage for TrancheBondStorage.Layout;
    using WaterTowerStorage for WaterTowerStorage.Layout;
    // using TrancheNotationStorage for TrancheNotationStorage.Layout;

    uint256 public constant FMV_DENOMINATOR = 100;
    uint256 public constant MINIMUM_FMV = 1;
    uint256 public constant MINIMUM_WATER = 32;
    uint256 public constant MATURITY_PERIOD = 180 days;

    /// @dev Events
    event CreateTranche(uint depositIndex, uint totalFMV, uint depositedAt);
    event ReceivePodsWithTranche(uint trancheIndex, uint[] podIndexes, uint totalPods);

    /// @dev Errors
    error InvalidPods();
    error NotOwnerOfTranche();
    error NotEligible();
    error NotMatureTranche();
    error InsufficientPods();

    /// @notice Create tranches by depositing group of pods
    /// @dev See transferPlot function in https://github.com/BeanstalkFarms/Beanstalk/blob/master/protocol/contracts/farm/facets/MarketplaceFacet/MarketplaceFacet.sol
    /// @param indexes Index array of deposited pods
    /// @param starts Array of start number for deposited pods
    /// @param ends Array of end number for deposited pods

    function createTranchesWithPods(
        uint256[] calldata indexes,
        uint256[] calldata starts,
        uint256[] calldata ends
    ) external onlyWaterHolder {
        if (indexes.length != starts.length || indexes.length != ends.length) revert InvalidPods();
        uint256[] memory podIndexes = new uint256[](indexes.length);
        uint128[] memory endPos = new uint128[](indexes.length);
        uint256 totalFMV;
        uint256 totalPods;
        for (uint256 i; i < indexes.length; ) {
            WaterCommonStorage.layout().beanstalk.transferPlot(
                msg.sender,
                address(this),
                indexes[i],
                starts[i],
                ends[i]
            );
            /// Checked inside of transferPlot function
            uint256 amount;
            uint256 id;
            unchecked {
                id = indexes[i] + starts[i];
                podIndexes[i] = id;
                amount = ends[i] - starts[i];
                TrancheBondStorage.layout().depositedPlots[id] = amount;
                totalPods += amount;
                endPos[i] = uint128(amount);
            }

            totalFMV += IPodsOracleUpgradeable(address(this)).latestPriceOfPods(id, amount);
            unchecked {
                ++i;
            }
        }
        if (totalFMV < MINIMUM_FMV) revert InvalidPods();
        uint256 curDepositPodsCount = TrancheBondStorage.layout().curDepositPodsCount + 1;

        /// Register pods deposit
        TrancheBondStorage.layout().depositedPods[curDepositPodsCount] = DepositPods({
            underlyingPodIndexes: podIndexes,
            startIndexAndOffsets: new uint128[](6),
            // startPos: new uint128[](indexes.length),
            // endPos: endPos,
            fmv: totalFMV,
            depositedAt: block.timestamp,
            totalPods: totalPods
        });

        /// Create tranche A, B, Z
        createTrancheNotations(curDepositPodsCount, totalFMV, msg.sender);
        TrancheBondStorage.layout().curDepositPodsCount = curDepositPodsCount;
        emit CreateTranche(curDepositPodsCount, totalFMV, block.timestamp);
    }

    /// @dev receive pods with tranches after maturity date is over
    function receivePodsWithTranches(uint256 trancheIndex) external {
        (TranchePods memory tranche, DepositPods memory depositPods) = getTranchePods(trancheIndex);
        if (block.timestamp - depositPods.depositedAt < MATURITY_PERIOD) revert NotMatureTranche();

        (uint256 offset, uint256 pods) = getAvailablePodsForUser(trancheIndex, msg.sender);
        if (pods == 0) revert InsufficientPods();
        // uint256[] memory underlyingPodIndexes = depositPods.underlyingPodIndexes;
        // uint128[] memory startIndexAndOffsets = depositPods.startIndexAndOffsets;
        uint8 level = (uint8)(tranche.level);
        uint256 startIndex = depositPods.startIndexAndOffsets[level];
        uint256 startOffset = depositPods.startIndexAndOffsets[level + 3];
        uint256[] memory receivePodIndexes = new uint256[](depositPods.underlyingPodIndexes.length);
        uint256 totalPods = pods;
        for (uint256 i; i < depositPods.underlyingPodIndexes.length; ) {
            if (pods == 0) break;
            uint8 _level = level;
            uint256 originalPodIndex = depositPods.underlyingPodIndexes[i];
            uint256 podsForEachPlot = TrancheBondStorage.layout().depositedPlots[originalPodIndex];
            /// when pods for the tranche is placed in this range, transfer the plot
            if (offset < podsForEachPlot) {
                uint256 _offset = offset;
                // we will tranfer podline [_offset, transferPods] in [realPodIndex, realPods]
                uint256 realPodIndex = originalPodIndex + _offset;
                // uint256 realOffset = _offset;
                // this means first call, in that case of A tranche, always offset = startOffset
                if (startIndex != i || _offset != startOffset) {
                    if (_level == 0) {
                        // error
                    }
                    // previous tranche start point is in original podline as same as current tranche
                    uint256 preIndex = depositPods.startIndexAndOffsets[_level - 1];
                    if (preIndex == i) {
                        // offset of A tranche for B trnache, B tranche for Z tranche
                        realPodIndex =
                            originalPodIndex +
                            depositPods.startIndexAndOffsets[_level + 2];
                        _offset -= depositPods.startIndexAndOffsets[_level + 2];
                    } else {
                        realPodIndex = originalPodIndex;
                    }
                }
                {
                    uint256 realPods = WaterCommonStorage.layout().beanstalk.plot(
                        address(this),
                        realPodIndex
                    );
                    uint256 transferPods;
                    if (realPods > pods) {
                        startIndex = i;
                        startOffset = pods;
                        transferPods = pods;
                    } else {
                        startIndex = i + 1;
                        startOffset = 0;
                        transferPods = realPods;
                    }
                    WaterCommonStorage.layout().beanstalk.transferPlot(
                        address(this),
                        msg.sender,
                        realPodIndex,
                        _offset,
                        transferPods
                    );
                    receivePodIndexes[i] = realPodIndex + _offset;
                    offset += transferPods;
                    pods -= transferPods;
                }
            } else {
                offset -= podsForEachPlot;
            }
            unchecked {
                i++;
            }
        }
        TrancheBondStorage.layout().depositedPods[tranche.depositPodsIndex].startIndexAndOffsets[
                level
            ] = uint128(startIndex);
        TrancheBondStorage.layout().depositedPods[tranche.depositPodsIndex].startIndexAndOffsets[
                level + 3
            ] = uint128(startOffset);
        TrancheBondStorage.layout().tranches[trancheIndex].claimed += totalPods;
        ITrancheNotationUpgradeable(address(this)).burnTrNotation(trancheIndex, msg.sender);
        emit ReceivePodsWithTranche(trancheIndex, receivePodIndexes, totalPods);
    }

    function createTrancheNotations(uint256 depositIndex, uint256 fmv, address owner) internal {
        /// @dev bean price should be updated as correct value
        uint256 beanPrice = IPriceOracleUpgradeable(address(this)).getPrice(Constants.BEAN);

        uint256[3] memory numeratorFMV = [uint256(20), 30, 50];
        TrancheLevel[3] memory levels = [TrancheLevel.A, TrancheLevel.B, TrancheLevel.Z];
        for (uint256 i = 0; i < 3; ) {
            uint256 fmvOfTranche = (fmv * numeratorFMV[i]) / FMV_DENOMINATOR;
            /// calculate total tranche notation value as 1 usd unit with 1e18 decimals
            uint256 totalSimulatedUsd = (fmvOfTranche * beanPrice) / 1e18;
            uint256 trancheIndex = depositIndex * 3 + i;
            TrancheBondStorage.layout().tranches[trancheIndex] = TranchePods({
                depositPodsIndex: depositIndex,
                level: levels[i],
                fmv: fmvOfTranche,
                claimed: 0
            });
            /// create tranche token with calculated usd value
            ITrancheNotationUpgradeable(address(this)).mintTrNotation(
                trancheIndex,
                totalSimulatedUsd,
                owner
            );
            unchecked {
                ++i;
            }
        }
    }

    /// @dev get functioins
    function getTranchePods(
        uint256 trancheIndex
    ) public view returns (TranchePods memory tranche, DepositPods memory depositPods) {
        tranche = TrancheBondStorage.layout().tranches[trancheIndex];
        depositPods = TrancheBondStorage.layout().depositedPods[tranche.depositPodsIndex];
    }

    function getAvailablePodsForUser(
        uint256 trancheIndex,
        address user
    ) public view returns (uint256 offset, uint256 pods) {
        uint256[3] memory numeratorFMV = [uint256(20), 30, 50];
        uint256[3] memory startIndexPercent = [uint256(0), 20, 50];
        (TranchePods memory tranche, DepositPods memory depositPods) = getTranchePods(trancheIndex);
        uint256 amount = ITrancheNotationUpgradeable(address(this)).balanceOfTrNotation(
            trancheIndex,
            user
        );
        if (amount == 0) return (0, 0);
        uint256 podsAmountForTranche = (numeratorFMV[uint8(tranche.level)] *
            depositPods.totalPods) / FMV_DENOMINATOR;
        if (podsAmountForTranche == 0) return (0, 0);
        offset =
            (startIndexPercent[uint8(tranche.level)] * depositPods.totalPods) /
            FMV_DENOMINATOR +
            tranche.claimed;
        pods =
            (amount * podsAmountForTranche) /
            ITrancheNotationUpgradeable(address(this)).getTotalSupply(trancheIndex);
    }

    function getFMV(uint256 trancheIndex) public view returns (uint256) {
        uint256[3] memory numeratorFMV = [uint256(20), uint256(30), uint256(50)];
        (TranchePods memory tranches, DepositPods memory depositPods) = getTranchePods(
            trancheIndex
        );
        return (depositPods.fmv * numeratorFMV[uint256(tranches.level)]) / FMV_DENOMINATOR;
    }

    function getDepositPlot(uint256 podIndex) external view returns (uint256) {
        return TrancheBondStorage.layout().depositedPlots[podIndex];
    }

    /// @dev modifiers
    modifier onlyWaterHolder() {
        if (WaterTowerStorage.userInfo(msg.sender).amount < MINIMUM_WATER * 1e18)
            revert NotEligible();
        _;
    }
}
