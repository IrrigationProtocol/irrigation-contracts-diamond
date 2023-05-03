// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ICurvePool {
    function get_virtual_price() external view returns (uint256);

    function exchange_underlying(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256);
}
