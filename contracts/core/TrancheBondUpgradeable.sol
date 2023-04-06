// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./TrancheBondStorage.sol";
// import "./TrancheNotationStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/ITrancheNotationUpgradeable.sol";

/// @title TrancheBond Contract
/// @dev Allows users deposit pods and receive tranches

contract TrancheBondUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using TrancheBondStorage for TrancheBondStorage.Layout;
    // using TrancheNotationStorage for TrancheNotationStorage.Layout;

    uint256 public constant FMV_DENOMINATOR = 100;
    uint256 public constant MINIMUM_FMV = 1;
    /// @dev Events
    event CreateTranche(uint256 depositIndex, uint256 totalFMV, uint256 depositedAt);
    /// @dev Errors
    error InvalidPods();
    error NotOwnerOfTranche();

    /// @notice Create tranches by depositing group of pods
    /// @dev See transferPlot function in https://github.com/BeanstalkFarms/Beanstalk/blob/master/protocol/contracts/farm/facets/MarketplaceFacet/MarketplaceFacet.sol
    /// @param indexes Index array of deposited pods
    /// @param starts Array of start number for deposited pods
    /// @param ends Array of end number for deposited pods

    function createTranchesWithPods(
        uint256[] calldata indexes,
        uint256[] calldata starts,
        uint256[] calldata ends
    ) external {
        if (indexes.length != starts.length || indexes.length != ends.length) revert InvalidPods();
        uint256[] memory podIndexes = new uint256[](indexes.length);
        uint256 totalFMV;
        uint256 id;
        uint256 amount;
        for (uint256 i; i < indexes.length; ) {
            WaterCommonStorage.layout().beanstalk.transferPlot(
                msg.sender,
                address(this),
                indexes[i],
                starts[i],
                ends[i]
            );
            /// Checked inside of transferPlot function
            unchecked {
                id = indexes[i] + starts[i];
                podIndexes[i] = id;
                amount = ends[i] - starts[i];
                TrancheBondStorage.layout().depositedPlots[id] = amount;
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
            fmv: totalFMV,
            depositedAt: block.timestamp
        });
        /// Create tranche A, B, Z
        createTrancheNotations(curDepositPodsCount, totalFMV, msg.sender);
        TrancheBondStorage.layout().curDepositPodsCount = curDepositPodsCount;
        emit CreateTranche(curDepositPodsCount, totalFMV, block.timestamp);
    }

    function createTrancheNotations(uint256 depositIndex, uint256 fmv, address owner) internal {
        /// @dev bean price should be updated as correct value
        uint256 beanPrice = 1;

        uint256[3] memory numeratorFMV = [uint256(20), 30, 50];
        TrancheLevel[3] memory levels = [TrancheLevel.A, TrancheLevel.B, TrancheLevel.Z];
        for (uint256 i = 0; i < 3; ) {
            uint256 fmvOfTranche = (fmv * numeratorFMV[i]) / FMV_DENOMINATOR;
            /// calculate total tranche notation value as 1 usd unit with 1e18 decimals
            uint256 totalSimulatedUsd = fmvOfTranche * beanPrice;
            uint256 trancheIndex = depositIndex * 3 + i;
            TrancheBondStorage.layout().tranches[trancheIndex] = TranchePods({
                depositPodsIndex: depositIndex,
                level: levels[i],
                fmv: fmvOfTranche
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

    function getFMV(uint256 trancheIndex) public view returns (uint256) {
        uint256[3] memory numeratorFMV = [uint256(20), uint256(30), uint256(50)];
        (TranchePods memory tranches, DepositPods memory depositPods) = getTranchePods(
            trancheIndex
        );
        return (depositPods.fmv * numeratorFMV[uint256(tranches.level)]) / FMV_DENOMINATOR;
    }
}
