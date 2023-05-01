// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./AggregatorV2V3Interface.sol";
import "./ChainlinkOracle.sol";

library PriceOracleStorage {
    struct Layout {
        mapping(address => uint256) prices;
        mapping(address => AggregatorV2V3Interface) chainlinkFeeds;
        ///
        // ChainlinkOracle chainlink;
        mapping(address => bool) chainlinkAssets;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.PriceOracle");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
