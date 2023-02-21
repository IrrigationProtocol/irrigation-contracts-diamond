// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


import { WaterOracleUpgradeable } from "./WaterOracleUpgradeable.sol";

library WaterOracleStorage {

  struct Layout {

    // Manually updated water price
    uint256 waterPrice;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('irrigation.contracts.storage.WaterOracle');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

