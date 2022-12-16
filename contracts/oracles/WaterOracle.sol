// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracle.sol";

contract WaterOracle is Ownable, IOracle {
    event WaterPriceUpdated(uint256 waterPrice);

    uint256 internal waterPrice;

    function latestPrice() external view returns (uint256) {
        return waterPrice;
    }

    function setWaterPrice(uint256 _waterPrice) external onlyOwner {
        waterPrice = _waterPrice;

        emit WaterPriceUpdated(_waterPrice);
    }
}
