// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../utils/EIP2535Initializable.sol";
import "../core/WaterTowerStorage.sol";

/// @title Upgrade 0.2: Add startTime on water tower pool storage

contract Upgrade002 is EIP2535Initializable, IrrigationAccessControl {
    using WaterTowerStorage for WaterTowerStorage.Layout;
    struct OldPoolInfo {
        uint256 totalRewardRate;
        uint256 monthlyRewards;
        uint256 endTime;
    }
    event Upgrade002PoolInfo(uint256 poolIndex, uint128 startTime, uint128 endTime);

    function init001() external reinitializer(2) onlyAdminRole {
        WaterTowerStorage.Layout storage l = WaterTowerStorage.layout();
        for (uint256 i = l.curPoolIndex; i > 0; --i) {
            PoolInfo storage poolInfo = l.pools[i];
            OldPoolInfo storage oldPoolInfo;
            assembly {
                oldPoolInfo.slot := poolInfo.slot
            }
            poolInfo.endTime = uint128(oldPoolInfo.endTime);
            poolInfo.startTime = oldPoolInfo.endTime != 0
                ? uint128(oldPoolInfo.endTime - 30 days)
                : 0;
            emit Upgrade002PoolInfo(i, poolInfo.startTime, poolInfo.endTime);
        }
    }
}
