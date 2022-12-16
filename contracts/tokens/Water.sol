// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Water is ERC20("Water Token", "WATER") {
    /**
     * @notice Mint 100 millions WATER.
     */
    constructor() {
        _mint(msg.sender, 100000000e18);
    }
}
