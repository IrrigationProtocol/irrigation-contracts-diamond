// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ICurvePoolUpgradeable {
    function get_virtual_price() external view returns (uint256);
}
