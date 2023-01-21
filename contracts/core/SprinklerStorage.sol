// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


import { SprinklerUpgradeable } from "./SprinklerUpgradeable.sol";
import { IBeanstalkUpgradeable } from "../beanstalk/IBeanstalkUpgradeable.sol";
import { IOracleUpgradeable } from "../interfaces/IOracleUpgradeable.sol";

library SprinklerStorage {

  struct Layout {

    // Water token address
    address waterToken;
    // Beanstalk protocol contract
    IBeanstalkUpgradeable beanstalk;
    mapping(address => IOracleUpgradeable) priceOracles;
    mapping(address => uint256) tokenMultiplier;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('openzeppelin.contracts.storage.Sprinkler');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

