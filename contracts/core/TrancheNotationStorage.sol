// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library TrancheNotationStorage {
    struct Layout {
        /// Mapping tranche index  => account => tranche token balance in usd unit
        mapping(uint256 => mapping(address => uint256)) balances;
        /// Total supply list in usd uint, mapping from tranche index to total usd value
        mapping(uint256 => uint256) totalSupplies;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.TrancheToken");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
