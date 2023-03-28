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
    uint256 fmv;
}

/// @notice user holds some of tranche, and we manage it as a notation

struct TrancheNotation {
    uint256 trancheIndex;
    uint256 start;
    uint256 end;
    address owner;
}

/// @notice stores group of podlines that user deposited

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
        // Stores all pods that users deposited, mapping from podline index to pods amount
        mapping(uint256 => uint256) depositedPlots;
        // Pods group deposited to create tranche by deposit index
        mapping(uint256 => DepositPods) depositedPods;        
        // A,B,Z tranches by tranche index. the total number of tranchePods is always 3 times than count of depositedPods
        mapping(uint256 => TranchePods) tranches;        
        // Count of deposited pods group, also it is used as a latest index
        uint256 curDepositPodsCount;
        // Mapping from tranche id to account notations
        mapping(uint256 => mapping(address => uint256)) notations;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.TrancheBond");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
