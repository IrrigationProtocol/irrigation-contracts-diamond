// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


import { WaterFaucetUpgradeable } from "./WaterFaucetUpgradeable.sol";
import { IERC20Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import { IERC1155Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/IERC1155Upgradeable.sol";

library WaterFaucetStorage {

  struct Layout {

    IERC20Upgradeable stalkToken;
    IERC20Upgradeable podsToken;
    IERC1155Upgradeable fertToken;

    WaterFaucetUpgradeable.Epoch[] epochs;

    mapping(address => mapping(uint256 => bool)) claimed;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('openzeppelin.contracts.storage.WaterFaucet');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

