// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./TrancheBondStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";

/// TrancheBond Contract allows users deposit pods and receive tranches

contract TrancheBondUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using TrancheBondStorage for TrancheBondStorage.Layout;
    /// errors
    error InvalidPods();

    /// @notice create tranches by depositing group of pods
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
            /// checked inside of transferPlot function
            unchecked {
                id = indexes[i] + starts[i];
                podIndexes[i] = i;
                amount = ends[i] - starts[i];
                TrancheBondStorage.layout().userPlots[msg.sender][id] = amount;
            }

            totalFMV += IPodsOracleUpgradeable(address(this)).latestPriceOfPods(id, amount);
            unchecked {
                ++i;
            }
        }
        uint256 curDepositPodsCount = TrancheBondStorage.layout().curDepositPodsCount;

        /// register pods deposit
        TrancheBondStorage.layout().depositedPods[++curDepositPodsCount] = DepositPods({
            underlyingPodIndexes: podIndexes,
            fmv: totalFMV,
            depositedAt: block.timestamp
        });
        /// create tranche A, B, Z
        TrancheBondStorage.layout().userTranchePods[curDepositPodsCount * 3] = TranchePods({
            depositPodsIndex: curDepositPodsCount,
            level: TrancheLevel.A,
            owner: msg.sender
        });
        TrancheBondStorage.layout().userTranchePods[curDepositPodsCount * 3 + 1] = TranchePods({
            depositPodsIndex: curDepositPodsCount,
            level: TrancheLevel.B,
            owner: msg.sender
        });
        TrancheBondStorage.layout().userTranchePods[curDepositPodsCount * 3 + 2] = TranchePods({
            depositPodsIndex: curDepositPodsCount,
            level: TrancheLevel.Z,
            owner: msg.sender
        });

        TrancheBondStorage.layout().curDepositPodsCount = curDepositPodsCount;
    }

    /// @dev get functioins
    function getTranchePods(
        uint256 trancheIndex
    ) public view returns (TranchePods memory tranchePods, DepositPods memory depositPods) {
        tranchePods = TrancheBondStorage.layout().userTranchePods[trancheIndex];
        depositPods = TrancheBondStorage.layout().depositedPods[tranchePods.depositPodsIndex];
    }
}
