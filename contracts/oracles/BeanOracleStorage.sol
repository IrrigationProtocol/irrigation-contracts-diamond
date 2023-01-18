// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import { BeanOracleUpgradeable } from "./BeanOracleUpgradeable.sol";
import { ICurveMetaPoolUpgradeable } from "../curve/ICurveMetaPoolUpgradeable.sol";
import { ICurvePoolUpgradeable } from "../curve/ICurvePoolUpgradeable.sol";

library BeanOracleStorage {

  struct Layout {

    // Bean/3Crv curve meta pool
    ICurveMetaPoolUpgradeable beanMetaPool;
    // 3Crv pool
    ICurvePoolUpgradeable threeCrvPool;
  
  }
  
  bytes32 internal constant STORAGE_SLOT = keccak256('openzeppelin.contracts.storage.BeanOracle');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}
    
