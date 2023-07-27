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
    Bid,
    Win,
    Cancel,
    Cleared
}

struct Bid {
    uint128 bidAmount;
    uint128 bidPrice;
    address bidder;
    // purchase token amount paid out when bidding
    uint128 paidAmount;
    uint16 bidTokenId;
    // bool bCleared;
    BidStatus status;
}

struct TokenData {
    // uint16 groupId;    
    uint16 id;
    // address token;
    uint8 decimals;
    bool isEnabled;
}

struct BidTokenGroup {
    address[] bidTokens;
    // calculated price by this address
    address basePriceToken;
    // max count of tokens in one group is 255
    // uint8 count;
    bytes32 name;
}

struct AuctionSetting {
    uint96 startTime;
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
    uint96 endTime;
    uint16 bidTokenGroupId;
    uint8 maxWinners;
    AuctionType auctionType;
    //
}
/// @dev Contains all data for auction erc20 token and tranche
struct AuctionData {
    AuctionSetting s;
    uint128 curBidId;
    uint128 totalBidAmount;
    //
    address seller;
    uint8 availableBidDepth;
    AuctionStatus status;
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
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.Auction");

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
