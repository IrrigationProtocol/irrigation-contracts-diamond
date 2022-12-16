// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ICurveMetaPool {
    function get_price_cumulative_last()
        external
        view
        returns (uint256[2] memory);

    function get_dy(
        int128 i,
        int128 j,
        uint256 dx,
        uint256[2] memory balances
    ) external view returns (uint256);
}
