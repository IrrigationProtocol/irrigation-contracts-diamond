// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { ERC20Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/ERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/proxy/utils/Initializable.sol";

contract MockERC20Upgradeable is Initializable, ERC20Upgradeable {
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
}
