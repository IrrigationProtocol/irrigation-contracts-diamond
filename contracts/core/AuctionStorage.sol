// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

enum AuctionType {
    TimedAuction,
    FixedPrice,
    TimedAndFixed
}

enum AuctionStatus {
    Open,
    Closed
}
struct Bid {
    uint128 bidAmount;
    uint128 bidPrice;
    address bidder; 
    address purchaseToken;
    bool bCleared;
}
struct AuctionData {
    address seller;
    uint96 startTime;
    uint96 duration;
    address sellToken;
    uint128 sellAmount;
    uint128 minBidAmount;
    uint128 fixedPrice;
    uint128 priceRangeStart;
    uint128 priceRangeEnd;
    uint128 reserve;
    uint256 curBidId;
    AuctionStatus status;
    AuctionType auctionType;
}

library AuctionStorage {
    struct Layout {
        uint256 currentAuctionId;
        mapping(uint256 => AuctionData) auctions;        
        mapping(uint256 => mapping(uint256 => Bid)) bids;
        mapping(address => bool) supportedPurchaseTokens;
        mapping(address => bool) supportedSellTokens;
        uint256 feeNumerator;
        address feeReceiver;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Auction");

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
