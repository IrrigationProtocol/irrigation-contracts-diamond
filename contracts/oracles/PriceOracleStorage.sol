// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./AggregatorV2V3Interface.sol";
import "../interfaces/ICustomOracle.sol";

enum OracleType {
    DIRECT,
    CHAINLINK,
    CURVE_FINANCE,
    UNISWAP_V2,
    UNISWAP_V3,
    CUSTOM_ORACLE
}
struct OracleItem {
    uint256 price;
    AggregatorV2V3Interface chainlinkFeed;
    ICustomOracle customOracle;
    OracleType oType;
}

library PriceOracleStorage {
    struct Layout {
        mapping(address => uint256) prices;
        mapping(address => AggregatorV2V3Interface) chainlinkFeeds;
        ///
        // ChainlinkOracle chainlink;
        mapping(address => bool) chainlinkAssets;
        /// oracle setting data for each token address
        mapping(address => OracleItem) oracleItems;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.PriceOracle");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
