// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

enum TrancheLevel {
    A,
    B,
    Z
}

enum UnderlyingAssetType {
    PODS,
    ERC20
}

struct TrancheMetadata {
    uint128 depositIndex;
    TrancheLevel level;
    /// claimed amount after maturity peroid is over
    uint256 claimedAmount;
}

struct UnderlyingAssetMetadata {
    // zero address if underlying asset is pods
    address contractAddress;
    UnderlyingAssetType assetType;
    uint64 maturityDate;
    // uint256 trancheAIndex;
    // total amount deposited in underlying asset
    // sum of pods if underlying asset is pods
    uint256 totalDeposited;
}


/// @notice stores group of podlines that user deposited
struct DepositPods {
    /// indexes of pods group
    uint256[] underlyingPodIndexes;
    /// represent divided podline after transfer some pods
    uint128[] startIndexAndOffsets;
    /// FMV Farmer Market Value in USD
    uint256 fmv;
}

library TrancheBondStorage {
    struct Layout {
        // Stores all pods that users deposited, mapping from podline index to pods amount
        mapping(uint256 => uint256) depositedPlots;
        // Pods group deposited to create tranche, mapping from deposit index to pods groups
        mapping(uint256 => DepositPods) depositedPods;

        mapping(uint256 => UnderlyingAssetMetadata) underlyingAssets;
        // Mapping from tranch index to A,B,Z tranches. the total number of tranchePods is always 3 times than count of depositedPods
        mapping(uint256 => TrancheMetadata) tranches;
        // Count of deposited pods group, also it is used as a latest index
        uint256 curDepositPodsCount;
        // uint256 curTrancheCount;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.TrancheBond");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
