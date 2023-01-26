// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


library WaterFaucetStorage {

  struct Epoch {
    uint256 amountPerUser;
    uint256 totalAmount;
    uint256 claimedAmount;
  }

  struct Layout {

    Epoch[] epochs;

    mapping(address => mapping(uint256 => bool)) claimed;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('irrigation.contracts.storage.WaterFaucet');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

