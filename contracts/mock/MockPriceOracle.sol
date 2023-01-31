// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../interfaces/IOracleUpgradeable.sol";

contract MockPriceOracle is IOracleUpgradeable {

    uint256 tempPrice;
    /**
     * @notice Get latest oracle price normalized to 1e18
     */
    function latestPrice() external view override returns (uint256){
        return tempPrice;
    }

    function mockSetPrice(uint256 _value) external {
        tempPrice = _value;
    }
}