// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./AuctionStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20MetadataUpgradeable.sol";

contract AuctionUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using AuctionStorage for AuctionStorage.Layout;

    event AuctionCreated(
        address indexed seller,
        uint256 startTime,
        uint256 duration,
        address sellToken,
        uint256 sellAmount,
        uint256 minBidAmount,
        uint256 fixedPrice,
        uint256 priceRangeStart,
        uint256 priceRangeEnd,
        AuctionType auctionType,
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
        uint256 auctionId,
        uint256 bidId
    );

    event UpdateAuctionBid(
        address indexed buyer,
        address indexed purchaseToken,
        uint256 bidPrice,
        uint256 auctionId,
        uint256 bidId,
        uint256 updatedBidId
    );

    uint256 public constant FEE_DENOMINATOR = 1000;

    function createAuction(
        uint96 startTime,
        uint96 duration,
        address sellToken,
        uint128 sellAmount,
        uint128 minBidAmount,
        uint128 fixedPrice,
        uint128 priceRangeStart,
        uint128 priceRangeEnd,
        AuctionType auctionType
    ) external returns (uint256) {
        TransferHelper.safeTransferFrom(
            sellToken,
            msg.sender,
            address(this),
            (uint256(sellAmount) * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                FEE_DENOMINATOR
        );
        require(sellAmount > 0, "cannot zero sell amount");
        require(startTime == 0 || startTime >= block.timestamp, "start time must be in the future");
        require(minBidAmount > 0 && minBidAmount <= sellAmount, "invalid minBidAmount");

        AuctionStorage.layout().currentAuctionId = AuctionStorage.layout().currentAuctionId + 1;
        uint96 localStartTime = startTime == 0 ? uint96(block.timestamp) : startTime;
        AuctionData memory auction = AuctionData(
            msg.sender,
            localStartTime,
            duration,
            sellToken,
            sellAmount,
            minBidAmount,
            fixedPrice,
            priceRangeStart,
            priceRangeEnd,
            sellAmount,
            0,
            AuctionStatus.Open,
            auctionType
        );
        AuctionStorage.layout().auctions[AuctionStorage.layout().currentAuctionId] = auction;
        emit AuctionCreated(
            msg.sender,
            localStartTime,
            duration,
            sellToken,
            sellAmount,
            minBidAmount,
            fixedPrice,
            priceRangeStart,
            priceRangeEnd,
            auctionType,
            AuctionStorage.layout().currentAuctionId
        );
        return AuctionStorage.layout().currentAuctionId;
    }

    function buyNow(
        uint256 auctionId,
        uint128 purchaseAmount,
        address purchaseToken
    ) external supportedPurchase(purchaseToken) {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            auction.auctionType != AuctionType.TimedAuction && auction.seller != address(0),
            "invalid auction for buyNow"
        );
        require(purchaseAmount <= auction.reserve, "big amount");

        // need auction conditions
        // consider decimals of purchase token and sell token
        uint256 payAmount = getPayAmount(
            purchaseToken,
            purchaseAmount,
            auction.fixedPrice,
            auction.sellToken
        );
        TransferHelper.safeTransferFrom(purchaseToken, msg.sender, auction.seller, payAmount);
        TransferHelper.safeTransfer(auction.sellToken, msg.sender, purchaseAmount);
        AuctionStorage.layout().auctions[auctionId].reserve = auction.reserve - purchaseAmount;
        emit AuctionBuy(msg.sender, purchaseAmount, purchaseToken, auctionId);
    }

    function placeBid(
        uint256 auctionId,
        uint128 bidAmount,
        address purchaseToken,
        uint128 bidPrice
    ) external supportedPurchase(purchaseToken) returns (uint256) {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            auction.seller != address(0) && auction.auctionType != AuctionType.FixedPrice,
            "invalid auction"
        );
        require(auction.minBidAmount <= bidAmount, "too small bid amount");
        // should add condition for timed
        // no bid
        if (auction.curBidId == 0) {
            require(bidPrice >= auction.priceRangeStart, "low Bid");
        } else {
            Bid memory lastBid = AuctionStorage.layout().bids[auctionId][auction.curBidId];
            require(bidPrice >= lastBid.bidPrice, "low Bid");
        }
        uint256 payAmount = getPayAmount(purchaseToken, bidAmount, bidPrice, auction.sellToken);

        TransferHelper.safeTransferFrom(purchaseToken, msg.sender, address(this), payAmount);
        Bid memory bid = Bid({
            bidder: msg.sender,
            bidAmount: bidAmount,
            bidPrice: bidPrice,
            purchaseToken: purchaseToken,
            bCleared: false
        });
        uint256 currentBidId = auction.curBidId + 1;
        AuctionStorage.layout().auctions[auctionId].curBidId = currentBidId;
        AuctionStorage.layout().bids[auctionId][auction.curBidId] = bid;
        emit AuctionBid(msg.sender, bidAmount, purchaseToken, bidPrice, auctionId, currentBidId);
        return currentBidId;
    }

    function closeAuction(uint256 auctionId) external {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint96 currentTime = uint96(block.timestamp);
        require(
            auction.seller != address(0) &&
                currentTime >= auction.startTime + auction.duration &&
                auction.status != AuctionStatus.Closed,
            "auction can't be closed"
        );
        _sattleAuction(auctionId);
    }

    function _sattleAuction(uint256 auctionId) internal {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        Bid memory lastBid = AuctionStorage.layout().bids[auctionId][auction.curBidId];
        require(lastBid.bidAmount <= auction.reserve, "insufficient ");
        TransferHelper.safeTransferFrom(
            auction.sellToken,
            address(this),
            lastBid.bidder,
            lastBid.bidAmount
        );
        AuctionStorage.layout().auctions[auctionId].reserve -= lastBid.bidAmount;
        AuctionStorage.layout().auctions[auctionId].status = AuctionStatus.Closed;
    }

    // admin setters
    function setPurchaseToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedPurchaseTokens[_token] = _bEnable;
    }

    function setSellToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedSellTokens[_token] = _bEnable;
    }

    function setAuctionFee(
        uint256 _newFeeNumerator,
        address _newfeeReceiver
    ) external onlySuperAdminRole {
        require(_newFeeNumerator <= 25, "Fee higher than 2.5%");
        // caution: for currently running auctions, the feeReceiver is changing as well.
        AuctionStorage.layout().feeReceiver = _newfeeReceiver;
        AuctionStorage.layout().feeNumerator = _newFeeNumerator;
    }

    // getters
    function getPayAmount(
        address purchaseToken,
        uint128 purchaseAmount,
        uint128 price,
        address sellToken
    ) public view returns (uint256) {
        uint256 payAmount = (uint256(purchaseAmount) * uint256(price)) /
            (10 **
                (18 -
                    IERC20MetadataUpgradeable(sellToken).decimals() +
                    IERC20MetadataUpgradeable(purchaseToken).decimals()));
        return payAmount;
    }

    function getAuction(uint256 _auctionId) public view returns (AuctionData memory) {
        return AuctionStorage.layout().auctions[_auctionId];
    }

    function getAuctionsCount() public view returns (uint256 totalAuctionsCount) {
        return AuctionStorage.layout().currentAuctionId;
    }

    // modifiers
    modifier supportedPurchase(address tokenAddress) {
        require(
            AuctionStorage.layout().supportedPurchaseTokens[tokenAddress],
            "no supported purchase"
        );
        _;
    }

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
