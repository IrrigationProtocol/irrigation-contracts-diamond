// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {SprinklerUpgradeable} from "./SprinklerUpgradeable.sol";
import {IBeanstalkUpgradeable} from "../beanstalk/IBeanstalkUpgradeable.sol";
import {ICustomOracle} from "../interfaces/ICustomOracle.sol";

// WhitelistAsset stores priceOracle address and multiplier for exchange for each token
// Whitelisted asset exchanges can be paused by setting isListed to false

struct WhitelistAsset {
    ICustomOracle priceOracle;
    bool isListed;
    uint256 tokenMultiplier;
}

library SprinklerStorage {
    struct Layout {
        // stores all whitelisted assets
        address[] allWhiteList;
        mapping(address => WhitelistAsset) whitelistAssets;
        ICustomOracle waterPriceOracle;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Sprinkler");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
