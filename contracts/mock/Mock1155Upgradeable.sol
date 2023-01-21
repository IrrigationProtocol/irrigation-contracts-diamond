// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { ERC1155Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import "../utils/EIP2535Initializable.sol";

contract Mock1155Upgradeable is EIP2535Initializable, ERC1155Upgradeable {
    function __Mock1155_init() internal onlyInitializing {
        __ERC1155_init_unchained("");
    }

    function __Mock1155_init_unchained() internal onlyInitializing {
    }
    function mint(uint256 tokenId, uint256 amount) external {
        _mint(msg.sender, tokenId, amount, "");
    }
}
