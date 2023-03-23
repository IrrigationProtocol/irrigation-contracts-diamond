// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

enum TrancheLevel {
    A,
    B,
    Z
}

struct TranchePods {
    uint256 depositPodsIndex;
    TrancheLevel level;
    address owner;
}

struct DepositPods {
    /// indexes of pods group
    uint256[] underlyingPodIndexes;
    /// FMV Farmer Market Value
    uint256 fmv;
    /// created timestamp
    uint256 depositedAt;
}

library TrancheBondStorage {
    struct Layout {
        /// represent all pods that users deposited
        mapping(address => mapping(uint256 => uint256)) userPlots;
        /// pods group deposited to create tranche by deposit index
        mapping(uint256 => DepositPods) depositedPods;
        /// A,B,Z tranches by tranche index,
        /// @notice the total number of tranchePods is always 3 times than count of depositedPods
        mapping(uint256 => TranchePods) userTranchePods;
        /// count of deposited pods group, also it is used as a latest index
        uint256 curDepositPodsCount;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.TrancheBond");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
