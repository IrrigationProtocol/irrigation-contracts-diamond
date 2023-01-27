// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISprinklerUpgradeable {
    /**
     * @notice Set price oracle
     */
    function setPriceOracle(address _token, address _oracle) external;
}
