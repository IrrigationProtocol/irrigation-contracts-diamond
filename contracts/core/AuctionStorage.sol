// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {SprinklerUpgradeable} from "./SprinklerUpgradeable.sol";
import {IBeanstalkUpgradeable} from "../beanstalk/IBeanstalkUpgradeable.sol";
import {IOracleUpgradeable} from "../interfaces/IOracleUpgradeable.sol";

enum AuctionType {
    TimedAuction,
    FixedPrice,
    TimedAndFixed
}

enum AuctionStatus {
    Open,
    Closed
}

library AuctionStorage {
    struct Bid {
        uint256 amount;
        // address bidder;
        uint256 bidPrice;
        address purchaseToken;
    }
    struct AuctionData {
        address seller;
        AuctionType auctionType;
        address sellToken;
        uint256 sellAmount;
        uint256 minBidAmount;
        uint96 duration;
        uint256 fixedPrice;
        uint256 priceRangeStart;
        uint256 priceRangeEnd;
        uint256 reserve;
        uint96 endTime;
        address lastBidder;
        AuctionStatus status;
    }
    struct Layout {
        uint256 currentAuctionId;
        mapping(uint256 => AuctionData) auctions;
        mapping(uint256 => mapping(address => Bid)) bids;
        mapping(address => bool) supportedPurchaseTokens;
        mapping(address => bool) supportedSellTokens;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Auction");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
