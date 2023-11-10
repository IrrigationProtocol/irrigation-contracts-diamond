// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";

/**
 * @author Publius
 * @title WETH Interface
**/
interface IWETH is IERC20Upgradeable {

    function deposit() external payable;
    function withdraw(uint) external;

}
