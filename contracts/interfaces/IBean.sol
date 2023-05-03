// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IERC20Upgradeable} from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";

/// @title Bean Interface

abstract contract IBean is IERC20Upgradeable {
    function burn(uint256 amount) public virtual;

    function burnFrom(address account, uint256 amount) public virtual;

    function mint(address account, uint256 amount) public virtual;
}
