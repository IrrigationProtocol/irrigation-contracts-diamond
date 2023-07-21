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
    uint16 id;
    uint8 decimals;
    bool isEnabled;
}

// struct BidTokenGroup {
//     mapping(uint256 => address) bidTokens;
//     // calculated price by this address
//     address basePriceToken;
//     // max count of tokens in one group is 255
//     uint8 count;
//     bytes32 name;
// }

/// @dev Contains all data for auction erc20 token and tranche
struct AuctionData {
    address seller;
    uint96 startTime;
    uint96 endTime;
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
        mapping(address => TokenData) bidTokenData;
        mapping(address => bool) supportedSellTokens;
        // mapping(uint256 => BidTokenGroup) bidTokenGroups;
        // uint256 countOfTokenGroups;
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
