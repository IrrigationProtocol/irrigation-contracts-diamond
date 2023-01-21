// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../interfaces/IOracleUpgradeable.sol";
import "../curve/ICurvePoolUpgradeable.sol";
import "../curve/ICurveMetaPoolUpgradeable.sol";
import { BeanOracleStorage } from "./BeanOracleStorage.sol";
import "../utils/EIP2535Initializable.sol";

contract BeanOracleUpgradeable is EIP2535Initializable, IOracleUpgradeable {
    using BeanOracleStorage for BeanOracleStorage.Layout;
    // 1 BEAN amount with decimals
    uint256 constant ONE = 1e6;
    // Bean index on curve metapool;
    int128 constant i = 0;
    // 3Crv index on curve metapool;
    int128 constant j = 1;

    function __BeanOracle_init(address _beanMetaPool, address _threeCrvPool) internal onlyInitializing {
        __BeanOracle_init_unchained(_beanMetaPool, _threeCrvPool);
    }

    function __BeanOracle_init_unchained(address _beanMetaPool, address _threeCrvPool) internal onlyInitializing {
        BeanOracleStorage.layout().beanMetaPool = ICurveMetaPoolUpgradeable(_beanMetaPool);
        BeanOracleStorage.layout().threeCrvPool = ICurvePoolUpgradeable(_threeCrvPool);
    }

    /**
     * @notice Get latest oracle price of BEAN normalized to 1e18
     * @dev Update 3crv price calculation
     * @return price latest BEAN price
     */
    function latestPrice() external view returns (uint256 price) {
        uint256[2] memory lastPrices = BeanOracleStorage.layout().beanMetaPool.get_price_cumulative_last();

        uint256 dy = BeanOracleStorage.layout().beanMetaPool.get_dy(i, j, ONE, lastPrices);
        uint256 threeCrvPrice = BeanOracleStorage.layout().threeCrvPool.get_virtual_price();
        price = (dy * threeCrvPrice) / 1e18;
    }
    // generated getter for ${varDecl.name}
    function beanMetaPool() public view returns(ICurveMetaPoolUpgradeable) {
        return BeanOracleStorage.layout().beanMetaPool;
    }

    // generated getter for ${varDecl.name}
    function threeCrvPool() public view returns(ICurvePoolUpgradeable) {
        return BeanOracleStorage.layout().threeCrvPool;
    }

}
