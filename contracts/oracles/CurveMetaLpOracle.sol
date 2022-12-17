// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../interfaces/IOracle.sol";
import "../curve/ICurveMetaPool.sol";

contract CurveMetaLpOracle is IOracle {
    // Curve Meta pool
    ICurveMetaPool public immutable metaPool;

    constructor(address _metaPool) {
        metaPool = ICurveMetaPool(_metaPool);
    }

    /**
     * @notice Get latest oracle price of Curve Meta LP normalized to 1e18
     * @dev Update 3crv price calculation
     * @return price latest Curve Meta LP price
     */
    function latestPrice() external view returns (uint256 price) {
        price = metaPool.get_virtual_price();
    }
}
