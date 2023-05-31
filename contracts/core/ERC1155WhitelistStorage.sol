// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library ERC1155WhitelistStorage {
    struct Layout {
        mapping(address => bool) isWhitelisted;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("irrigation.contracts.storage.ERC1155Whitelist");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
