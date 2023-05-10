// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {IERC20Upgradeable} from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";

/// @notice User reward per each month
struct UserPoolInfo {    
    /// @dev reward rate = sum (block time * amount)
    uint256 rewardRate;
    // claimed amount
    uint256 claimed;
}

/// @notice User Setting Info
struct UserInfo {
    bool isAutoIrrigate;    
    uint256 lastPoolIndex;
    // deposited water amount
    uint256 amount;
}

struct PoolInfo {
    uint256 totalRewardRate;
    // uint256 totalDeposits;
    uint256 monthlyRewards;
    uint256 endTime;
}

library WaterTowerStorage {
    struct Layout {
        mapping(address => UserInfo) userSettings;
        // Middle token address for irrigating reward
        address middleAssetForIrrigate;
        // total ether reward received from other markets
        uint256 totalRewards;
        // pool info per month
        mapping(uint256 => PoolInfo) pools;
        // user info per month
        mapping(uint256 => mapping(address => UserPoolInfo)) users;        
        // current pool index
        uint256 curPoolIndex;
        uint256 totalDeposits;        
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.WaterTower");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function curPool() internal view returns (PoolInfo storage) {
        return layout().pools[layout().curPoolIndex];
    }

    function curUserPoolInfo(address user) internal view returns (UserPoolInfo storage) {
        return layout().users[layout().curPoolIndex][user];
    }

    function userInfo(address user) internal view returns (UserInfo storage) {
        return layout().userSettings[user];
    }
}
