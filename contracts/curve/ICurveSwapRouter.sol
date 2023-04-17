// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface ICurveSwapRouter {
    function exchange_multiple(
        address[9] calldata _route,
        uint256[3][4] calldata _swap_params,
        uint256 _amount,
        uint256 _expected
        // address[4] calldata pools,
        // address receiver
    ) external payable returns (uint256);
}
