// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface IOracle {
    /**
     * @notice Get latest oracle price with 18 decimals
     */
    function latestPrice() external view returns (uint256);
}
