// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface IOracleUpgradeable {
    /**
     * @notice Get latest oracle price normalized to 1e18
     */
    function latestPrice() external view returns (uint256);
}
