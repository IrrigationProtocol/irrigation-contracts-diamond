// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;


import { CurveMetaLpOracleUpgradeable } from "./CurveMetaLpOracleUpgradeable.sol";
import { ICurveMetaPool } from "../curve/ICurveMetaPool.sol";

library CurveMetaLpOracleStorage {

  struct Layout {
    // Curve Meta pool
    ICurveMetaPool metaPool;

  }

  bytes32 internal constant STORAGE_SLOT = keccak256('irrigation.contracts.storage.CurveMetaLpOracle');

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

