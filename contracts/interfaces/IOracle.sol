// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface IOracle {
    function latestPrice() external view returns (uint256);
}
