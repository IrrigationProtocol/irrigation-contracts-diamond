// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../interfaces/IOracleUpgradeable.sol";
import "../curve/ICurveMetaPoolUpgradeable.sol";
import { CurveMetaLpOracleStorage } from "./CurveMetaLpOracleStorage.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/proxy/utils/Initializable.sol";

contract CurveMetaLpOracleUpgradeable is Initializable, IOracleUpgradeable {
    using CurveMetaLpOracleStorage for CurveMetaLpOracleStorage.Layout;

    function __CurveMetaLpOracle_init(address _metaPool) internal onlyInitializing {
        __CurveMetaLpOracle_init_unchained(_metaPool);
    }

    function __CurveMetaLpOracle_init_unchained(address _metaPool) internal onlyInitializing {
        CurveMetaLpOracleStorage.layout().metaPool = ICurveMetaPoolUpgradeable(_metaPool);
    }

    /**
     * @notice Get latest oracle price of Curve Meta LP normalized to 1e18
     * @dev Update 3crv price calculation
     * @return price latest Curve Meta LP price
     */
    function latestPrice() external view returns (uint256 price) {
        price = CurveMetaLpOracleStorage.layout().metaPool.get_virtual_price();
    }
    // generated getter for ${varDecl.name}
    function metaPool() public view returns(ICurveMetaPoolUpgradeable) {
        return CurveMetaLpOracleStorage.layout().metaPool;
    }

}
