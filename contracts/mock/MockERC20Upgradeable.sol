// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/ERC20Upgradeable.sol";
import "../utils/EIP2535Initializable.sol";

contract MockERC20Upgradeable is EIP2535Initializable, ERC20Upgradeable {
    function __MockERC20_init(
        string memory _name,
        string memory _symbol,
        uint256 supply
    ) internal onlyInitializing {
        __ERC20_init_unchained(_name, _symbol);
        __MockERC20_init_unchained(_name, _symbol, supply);
    }

    function __MockERC20_init_unchained(
        string memory,
        string memory,
        uint256 supply
    ) internal onlyInitializing {
        _mint(msg.sender, supply);
    }

    function Token_Initialize(
        string memory _name,
        string memory _symbol,
        uint256 supply
    ) public initializer {
        __MockERC20_init(_name, _symbol, supply);
    }
}
