// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ICurvePool {
    function get_virtual_price() external view returns (uint256);
}
