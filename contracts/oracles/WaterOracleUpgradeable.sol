// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/access/OwnableUpgradeable.sol";
import "../interfaces/IOracleUpgradeable.sol";
import { WaterOracleStorage } from "./WaterOracleStorage.sol";
import "../utils/EIP2535Initializable.sol";

contract WaterOracleUpgradeable is EIP2535Initializable, OwnableUpgradeable, IOracleUpgradeable {
    using WaterOracleStorage for WaterOracleStorage.Layout;
    function __WaterOracle_init() internal onlyInitializing {
        __Ownable_init_unchained();
    }

    function __WaterOracle_init_unchained() internal onlyInitializing {
    }
    event WaterPriceUpdated(uint256 waterPrice);

    /**
     * @notice Get latest oracle price of WATER normalized to 1e18
     * @return price latest WATER price
     */
    function latestPrice() external view returns (uint256 price) {
        price = WaterOracleStorage.layout().waterPrice;
    }

    /**
     * @notice Set water price manually by admin
     * @param _waterPrice new water price
     */
    function setWaterPrice(uint256 _waterPrice) external onlyOwner {
        WaterOracleStorage.layout().waterPrice = _waterPrice;

        emit WaterPriceUpdated(_waterPrice);
    }
}
