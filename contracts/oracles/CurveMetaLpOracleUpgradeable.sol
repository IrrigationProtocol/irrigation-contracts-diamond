// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/ICustomOracle.sol";
import "../curve/ICurveMetaPool.sol";
import { CurveMetaLpOracleStorage } from "./CurveMetaLpOracleStorage.sol";
import "../utils/EIP2535Initializable.sol";

contract CurveMetaLpOracleUpgradeable is EIP2535Initializable, ICustomOracle {
    using CurveMetaLpOracleStorage for CurveMetaLpOracleStorage.Layout;

    function __CurveMetaLpOracle_init(address _metaPool) internal onlyInitializing {
        __CurveMetaLpOracle_init_unchained(_metaPool);
    }

    function __CurveMetaLpOracle_init_unchained(address _metaPool) internal onlyInitializing {
        CurveMetaLpOracleStorage.layout().metaPool = ICurveMetaPool(_metaPool);
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
    function metaPool() public view returns(ICurveMetaPool) {
        return CurveMetaLpOracleStorage.layout().metaPool;
    }

}
