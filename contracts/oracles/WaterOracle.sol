// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracle.sol";

contract WaterOracle is Ownable, IOracle {
    event WaterPriceUpdated(uint256 waterPrice);

    // Manually updated water price
    uint256 internal waterPrice;

    /**
     * @notice Get latest oracle price of WATER normalized to 1e18
     * @return price latest WATER price
     */
    function latestPrice() external view returns (uint256 price) {
        price = waterPrice;
    }

    /**
     * @notice Set water price manually by admin
     * @param _waterPrice new water price
     */
    function setWaterPrice(uint256 _waterPrice) external onlyOwner {
        waterPrice = _waterPrice;

        emit WaterPriceUpdated(_waterPrice);
    }
}
