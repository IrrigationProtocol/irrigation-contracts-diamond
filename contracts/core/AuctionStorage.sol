
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

enum AuctionType {
    TimedAuction,
    FixedPrice,
    TimedAndFixed
}

/// @dev we supports Tranche and ERC20 as listed assets

enum AssetType {
    ERC20,
    Tranche
}

enum AuctionStatus {
    Open,
    Closed
}

enum BidStatus {
    BID,
    WIN,
    CANCEL,
    CLEARED
}

struct Bid {
    uint128 bidAmount;
    uint128 bidPrice;
    address bidder;
    // purchase token amount paid out when bidding
    uint96 paidAmount;
    address purchaseToken;
    // bool bCleared;
    BidStatus status;
}

/// @dev Contains all data for auction erc20 token and tranche
struct AuctionData {
    address seller;
    uint96 startTime;
    uint96 duration;
    address sellToken;
    uint256 trancheIndex;
    uint128 sellAmount;
    uint128 minBidAmount;
    uint128 fixedPrice;
    uint128 priceRangeStart;
    uint128 priceRangeEnd;
    uint128 reserve;
    uint256 curBidId;
    uint96 incrementBidPrice;
    // sum of bidAmounts of bidders
    uint128 totalBidAmount;
    uint8 maxWinners;
    // bids in [id = curBidId + 1 - availableBidDepth, curBidId] are winners
    // availableBidDepth <= maxWinners
    uint8 availableBidDepth;
    AuctionStatus status;
    AuctionType auctionType;
    // asset type is decided by whether trancheIndex is 0, or not
    // AssetType assetType;
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
        uint96 maxIncrementRate;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Auction");

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
