// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/ICustomOracle.sol";
import "../curve/ICurvePool.sol";
import "../curve/ICurveMetaPool.sol";

contract BeanPriceOracle is ICustomOracle {
    // 1 BEAN amount with decimals
    uint256 constant ONE = 1e6;
    // Bean index on curve metapool;
    int128 constant i = 0;
    // 3Crv index on curve metapool;
    int128 constant j = 1;

    // Bean/3Crv curve meta pool
    ICurveMetaPool public immutable beanMetaPool;
    // 3Crv pool
    ICurvePool public immutable threeCrvPool;

    constructor(address _beanMetaPool, address _threeCrvPool) {
        beanMetaPool = ICurveMetaPool(_beanMetaPool);
        threeCrvPool = ICurvePool(_threeCrvPool);
    }

    /**
     * @notice Get latest oracle price of BEAN normalized to 1e18
     * @dev Update 3crv price calculation
     * @return price latest BEAN price
     */
    function latestPrice() external view returns (uint256 price) {
        uint256[2] memory lastPrices = beanMetaPool.get_price_cumulative_last();

        uint256 dy = beanMetaPool.get_dy(i, j, ONE, lastPrices);
        uint256 threeCrvPrice = threeCrvPool.get_virtual_price();
        price = (dy * 1e18) / threeCrvPrice;
    }
}
