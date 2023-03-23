// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../interfaces/IOracleUpgradeable.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";
import "../utils/EIP2535Initializable.sol";
import "../core/WaterCommonStorage.sol";
import "../libraries/Oracle/LibPrice.sol";

contract PodsOracleUpgradeable is IPodsOracleUpgradeable, IOracleUpgradeable {
    // decimals of price is 18
    uint256 constant ONE = 1e18;

    /**
     * @notice Get latest oracle price of BEAN normalized to 1e18
     * @dev Update 3crv price calculation
     * @return price latest BEAN price
     */
    function latestPrice() external view returns (uint256 price) {
        price = ONE;
    }

    function latestPriceOfPods(
        uint256 placeInLine,
        uint256 pods
    ) public view returns (uint256 price) {
        uint256 podIndex = WaterCommonStorage.layout().beanstalk.podIndex();
        uint256 harvestableIndex = WaterCommonStorage.layout().beanstalk.harvestableIndex();
        price = LibPrice.getPriceOfPods(placeInLine, pods, podIndex, harvestableIndex);
    }

    /// @dev see {IPodsOracleUpgradeable}
    function priceOfPods(
        uint256 placeInLine,
        uint256 pods,
        uint256 podIndex,
        uint256 harvestableIndex
    ) public pure returns (uint256 price) {
        price = LibPrice.getPriceOfPods(placeInLine, pods, podIndex, harvestableIndex);
    }
}
