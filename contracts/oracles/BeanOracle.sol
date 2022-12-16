// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracle.sol";
import "../curve/ICurveMetaPool.sol";

contract BeanOracle is Ownable, IOracle {
    uint256 constant ONE = 1e6; // 1 BEAN;
    int128 constant i = 0; // Bean index on curve metapool;
    int128 constant j = 1; // 3Crv index on curve metapool;

    ICurveMetaPool public immutable beanMetaPool;

    constructor(address _beanMetaPool) {
        beanMetaPool = ICurveMetaPool(_beanMetaPool);
    }

    // Assume 3Crv price is 1$. TODO: update it later
    // Return price with 18 decimals
    function latestPrice() external view returns (uint256) {
        uint256[2] memory lastPrices = beanMetaPool.get_price_cumulative_last();

        return beanMetaPool.get_dy(i, j, ONE, lastPrices);
    }
}
