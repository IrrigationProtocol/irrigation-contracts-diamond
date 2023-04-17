// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ISprinklerUpgradeable {
    /**
     * @notice Set price oracle
     */
    function setPriceOracle(address _token, address _oracle) external;

    function getWaterAmount(
        address _token,
        uint256 _amount
    ) external view returns (uint256 waterAmount);
}
