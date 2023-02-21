// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


import { WaterTowerUpgradeable } from "./WaterTowerUpgradeable.sol";
import { IERC20Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";

library WaterTowerStorage {

  struct UserInfo {
    uint256 amount;
    uint256 debt;
    uint256 pending;
  }

  struct Layout {

    mapping(address => UserInfo) userInfo;

    uint256 totalDeposits;

    uint256 sharePerWater;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('irrigation.contracts.storage.WaterTower');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

