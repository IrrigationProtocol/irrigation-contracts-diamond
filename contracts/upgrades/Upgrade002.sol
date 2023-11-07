// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../core/WaterTowerStorage.sol";
import "../core/AuctionStorage.sol";

/// @title Upgrade 0.2: Add startTime on water tower pool storage

contract Upgrade002 {
    struct OldPoolInfo {
        uint256 totalRewardRate;
        uint256 monthlyRewards;
        uint256 endTime;
    }
    event Upgrade002PoolInfo();

    function init002(uint256[] calldata auctionIds) external {
        // startTime for old auctions is 30 days ago than endTime
        WaterTowerStorage.Layout storage l = WaterTowerStorage.layout();
        for (uint256 i = l.curPoolIndex; i > 0; ) {
            PoolInfo storage poolInfo = l.pools[i];
            OldPoolInfo storage oldPoolInfo;
            assembly {
                oldPoolInfo.slot := poolInfo.slot
            }
            poolInfo.endTime = uint128(oldPoolInfo.endTime);
            unchecked {
                poolInfo.startTime = uint128(oldPoolInfo.endTime - 30 days);
                --i;
            }
        }
        // locked feeLevel is 0 for old auctions
        AuctionStorage.Layout storage al = AuctionStorage.layout();
        for (uint256 i; i < auctionIds.length; ) {
            al.auctions[auctionIds[i]].lockedLevel = 0;
            unchecked {
                ++i;
            }
        }
        // default fee levels
        al.fee.limits = [0, 32 * 1e18, 320 * 1e18, 3200 * 1e18, 32000 * 1e18, 320000 * 1e18];
        al.fee.listingFees = [25000, 10000, 6600, 3300, 2000, 0];
        al.fee.successFees = [50000, 15000, 10000, 7500, 5000, 5000];
        al.feeForTower = 25000;
        emit Upgrade002PoolInfo();
    }
}
