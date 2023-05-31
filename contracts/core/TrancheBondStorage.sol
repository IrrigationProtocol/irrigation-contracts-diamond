// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

enum TrancheLevel {
    A,
    B,
    Z
}

enum UnderlyingAssetType {
    ERC20,
    PODS
}

struct TranchePods {
    uint256 depositPodsIndex;
    TrancheLevel level;
    uint256 fmv;
    /// claimed amount after maturity peroid is over
    uint256 claimed;
}

struct UnderlyingAssetMetadata {
    address contractAddress;
    UnderlyingAssetType assetType;
}

/// @notice stores group of podlines that user deposited
struct DepositPods {
    /// indexes of pods group
    uint256[] underlyingPodIndexes;
    /// represent divided podline after transfer some pods
    uint128[] startIndexAndOffsets;
    /// FMV Farmer Market Value
    uint256 fmv;
    /// created timestamp
    uint256 depositedAt;
    /// total pods
    uint256 totalPods;
    uint256 maturityDate;
}

library TrancheBondStorage {
    struct Layout {
        // Stores all pods that users deposited, mapping from podline index to pods amount
        mapping(uint256 => uint256) depositedPlots;
        // Pods group deposited to create tranche, mapping from deposit index to pods groups
        mapping(uint256 => DepositPods) depositedPods;
        // Mapping from tranch index to A,B,Z tranches. the total number of tranchePods is always 3 times than count of depositedPods
        mapping(uint256 => TranchePods) tranches;
        // Count of deposited pods group, also it is used as a latest index
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
