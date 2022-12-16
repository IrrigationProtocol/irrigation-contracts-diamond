// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracle.sol";
import "../curve/ICurveMetaPool.sol";

contract BeanOracle is Ownable, IOracle {
    // 1 BEAN amount with decimals
    uint256 constant ONE = 1e6;
    // Bean index on curve metapool;
    int128 constant i = 0;
    // 3Crv index on curve metapool;
    int128 constant j = 1;

    // Bean/3Crv curve meta pool
    ICurveMetaPool public immutable beanMetaPool;

    constructor(address _beanMetaPool) {
        beanMetaPool = ICurveMetaPool(_beanMetaPool);
    }

    /**
     * @notice Get latest oracle price of BEAN with 18 decimals
     * @dev Assume 3Crv is 1$. Update it later
     * @return price latest BEAN price
     */
    function latestPrice() external view returns (uint256 price) {
        uint256[2] memory lastPrices = beanMetaPool.get_price_cumulative_last();

        price = beanMetaPool.get_dy(i, j, ONE, lastPrices);
    }
}
