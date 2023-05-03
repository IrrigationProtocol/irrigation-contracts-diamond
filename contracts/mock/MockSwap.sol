// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../curve/ICurveSwapRouter.sol";
import "../libraries/Constants.sol";

contract MockSwap {
    uint256 public swappedAmount;

    /**
     * @notice swap ether for BEAN
     */
    function mockSwap(uint256 amount) external payable returns (uint256) {
        address[9] memory route = [
            Constants.ETHER,
            Constants.TRI_CRYPTO_POOL,
            Constants.USDT,
            Constants.CURVE_BEAN_METAPOOL,
            Constants.BEAN,
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000
        ];
        uint256[3][4] memory swapParams = [
            [uint(2), 0, 3],
            [uint(3), 0, 2],
            [uint(0), 0, 0],
            [uint(0), 0, 0]
        ];
        swappedAmount = ICurveSwapRouter(Constants.CURVE_ROUTER).exchange_multiple{value: amount}(
            route,
            swapParams,
            amount,
            0
        );
        return swappedAmount;
    }

   receive() external payable {

   }
}
