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
    // bid token amount paid out when bidding
    uint128 paidAmount;
    uint16 bidTokenId;
    bool bCleared;
}

struct BidTokenGroup {
    // tokens in one group should be max 255
    address[] bidTokens;
    // calculated price by this address
    address basePriceToken;
    bytes32 name;
}

struct AuctionSetting {
    uint48 startTime;
    uint48 endTime;
    address sellToken;
    //
    uint256 trancheIndex;
    //
    uint128 minBidAmount;
    uint128 fixedPrice;
    //
    uint128 priceRangeStart;
    uint128 priceRangeEnd;
    //
    uint128 sellAmount;
    uint128 reserve;
    //
    uint128 incrementBidPrice;
    uint16 bidTokenGroupId;
    uint8 maxWinners;
    AuctionType auctionType;
}
/// @dev Contains all data for auction erc20 token and tranche
struct AuctionData {
    AuctionSetting s;
    //
    uint128 curBidId;
    uint128 totalBidAmount;
    //
    address seller;
    uint8 availableBidDepth;
    AuctionStatus status;
    //
    uint256 feeAmount;
}

library AuctionStorage {
    struct Layout {
        uint256 currentAuctionId;
        mapping(uint256 => AuctionData) auctions;
        mapping(uint256 => mapping(uint256 => Bid)) bids;
        // mapping(address => TokenData) bidTokenData;
        mapping(address => bool) supportedSellTokens;
        mapping(uint256 => BidTokenGroup) bidTokenGroups;
        uint256 countOfTokenGroups;
        // all allowed bid token addresses
        address[] bidTokens;
        uint256 feeNumerator;
        address feeReceiver;
        uint96 maxIncrementRate;
        uint48[] periods;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Auction");

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
