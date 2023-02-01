// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./AuctionStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "../libraries/SafeMathUpgradeable96.sol";

contract AuctionUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using SafeMathUpgradeable96 for uint96;
    using AuctionStorage for AuctionStorage.Layout;

    event FixedAuctionCreated(
        address indexed creator,
        address indexed tokenAddressToSell,
        uint256 tokenAmountToSell,
        uint256 auctionDuration,
        uint256 fixedPrice,
        uint256 auctionId
    );

    event TimedAuctionCreated(
        address indexed creator,
        address indexed tokenAddressToSell,
        uint256 tokenAmountToSell,
        uint256 auctionDuration,
        uint256 priceRangeStart,
        uint256 priceRangeEnd,
        uint256 auctionId
    );

    event AuctionBuy(
        address indexed buyer,
        uint256 amountToBuy,
        address indexed purchaseToken,
        uint256 auctionId
    );

    event AuctionBid(
        address indexed buyer,
        uint256 amountToBid,
        address indexed purchaseToken,
        uint256 bidPrice,
        uint256 auctionId
        // uint256 bidId
    );

    event UpdateAuctionBid(
        address indexed buyer,
        address indexed purchaseToken,
        uint256 bidPrice,
        uint256 auctionId,
        uint256 bidId
    );

    function createAuction(
        AuctionType auctionType,
        address sellToken,
        uint256 sellAmount,
        uint256 minBidAmount,
        uint96 duration,
        uint256 fixedPrice,
        uint256 priceRangeStart,
        uint256 priceRangeEnd
    ) external returns (uint256) {
        TransferHelper.safeTransferFrom(sellToken, msg.sender, address(this), sellAmount);
        AuctionStorage.layout().currentAuctionId++;
        AuctionStorage.AuctionData memory auction = AuctionStorage.AuctionData(
            msg.sender,
            auctionType,
            sellToken,
            sellAmount,
            minBidAmount,
            duration,
            fixedPrice,
            priceRangeStart,
            priceRangeEnd,
            sellAmount,
            0,
            address(0),
            AuctionStatus.Open
        );
        AuctionStorage.layout().auctions[AuctionStorage.layout().currentAuctionId] = auction;
        if (auctionType == AuctionType.FixedPrice || auctionType == AuctionType.TimedAndFixed)
            emit FixedAuctionCreated(
                msg.sender,
                sellToken,
                sellAmount,
                duration,
                fixedPrice,
                AuctionStorage.layout().currentAuctionId
            );
        if (auctionType == AuctionType.TimedAuction || auctionType == AuctionType.TimedAndFixed)
            emit TimedAuctionCreated(
                msg.sender,
                sellToken,
                sellAmount,
                duration,
                priceRangeStart,
                priceRangeEnd,
                AuctionStorage.layout().currentAuctionId
            );
        return AuctionStorage.layout().currentAuctionId;
    }

    function buyNow(uint256 auctionId, uint256 purchaseAmount, address purchaseToken) external {
        require(
            AuctionStorage.layout().supportedPurchaseTokens[purchaseToken] == true,
            "invalid token"
        );
        AuctionStorage.AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(auction.seller != address(0), "invalid auction");
        require(purchaseAmount <= auction.reserve, "big amount");
        require(auction.auctionType != AuctionType.TimedAuction, "big amount");

        // need auction conditions
        // consider decimals of purchase token and sell token
        TransferHelper.safeTransferFrom(
            purchaseToken,
            msg.sender,
            auction.seller,
            (purchaseAmount * auction.fixedPrice) / 1e18
        );
        TransferHelper.safeTransfer(auction.sellToken, msg.sender, purchaseAmount);
        auction.reserve -= purchaseAmount;
        emit AuctionBuy(msg.sender, purchaseAmount, purchaseToken, auctionId);
    }

    function placeBid(
        uint256 auctionId,
        uint256 amountToBid,
        address purchaseToken,
        uint256 bidPrice
    ) external {
        AuctionStorage.AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            auction.seller != address(0) && auction.auctionType != AuctionType.FixedPrice,
            "invalid auction"
        );
        require(auction.minBidAmount <= amountToBid, "too small amount");
        // should add condition for timed
        uint96 currentTime = uint96(block.timestamp);
        if (auction.lastBidder == address(0)) {
            // no bid
            uint96 endTime = currentTime.add(auction.duration);
            AuctionStorage.layout().auctions[auctionId].endTime = endTime;
            require(bidPrice < auction.priceRangeStart, "low Bid");
        } else {
            require(msg.sender != auction.lastBidder, "already win bidder");
            AuctionStorage.Bid memory lastBid = AuctionStorage.layout().bids[auctionId][
                auction.lastBidder
            ];
            require(bidPrice <= lastBid.bidPrice, "low Bid");
            // cancel last hight bid
            TransferHelper.safeTransfer(
                purchaseToken,
                auction.lastBidder,
                (lastBid.amount * lastBid.bidPrice) / 1e18
            );
        }
        uint256 purchaseTokenAmount = (amountToBid * bidPrice) / 1e18;
        TransferHelper.safeTransferFrom(
            purchaseToken,
            msg.sender,
            address(this),
            purchaseTokenAmount
        );
        AuctionStorage.Bid memory bid = AuctionStorage.Bid(
            amountToBid,
            // msg.sender,
            bidPrice,
            purchaseToken
        );
        AuctionStorage.layout().auctions[auctionId].lastBidder = msg.sender;
        AuctionStorage.layout().bids[auctionId][msg.sender] = bid;
        emit AuctionBid(msg.sender, amountToBid, purchaseToken, bidPrice, auctionId);
    }

    function closeAuction(uint256 auctionId) external {
        AuctionStorage.AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint96 currentTime = uint96(block.timestamp);
        require(
            auction.seller != address(0) &&
                currentTime >= auction.endTime &&
                auction.status != AuctionStatus.Closed,
            "invalid auction"
        );
        _sattleAuction(auctionId);
    }

    function _sattleAuction(uint256 auctionId) internal {
        AuctionStorage.AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        AuctionStorage.Bid memory lastBid = AuctionStorage.layout().bids[auctionId][
            auction.lastBidder
        ];
        require(lastBid.amount <= auction.reserve, "insufficient ");
        TransferHelper.safeTransferFrom(
            auction.sellToken,
            address(this),
            auction.lastBidder,
            lastBid.amount
        );
        AuctionStorage.layout().auctions[auctionId].reserve -= lastBid.amount;
        AuctionStorage.layout().auctions[auctionId].status = AuctionStatus.Closed;
    }

    // admin setters
    function setPurchaseToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedPurchaseTokens[_token] = _bEnable;
    }

    function setSellToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedSellTokens[_token] = _bEnable;
    }

    // getters
    function getAuction(
        uint256 _auctionId
    ) public view returns (AuctionStorage.AuctionData memory) {
        return AuctionStorage.layout().auctions[_auctionId];
    }

    function getAuctionsCount() public view returns (uint256 totalAuctionsCount) {
        return AuctionStorage.layout().currentAuctionId;
    }

    // modifiers
    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(address seller, uint endTime, uint startTime) internal view {
        require(
            seller != address(0) && _checkAuctionRangeTime(endTime, startTime),
            "auction is inactive"
        );
    }

    function _checkAuctionRangeTime(uint endTime, uint startTime) internal view returns (bool) {
        uint currentTime = block.timestamp;
        if (startTime > 0 && startTime > currentTime) {
            return false;
        }
        if (endTime > 0 && endTime <= currentTime) {
            return false;
        }
        return true;
    }
}
