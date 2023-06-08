// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20MetadataUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC1155Upgradeable.sol";
import "./AuctionStorage.sol";
import "./TrancheBondStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "../libraries/FullMath.sol";
import "../libraries/Constants.sol";

import "../interfaces/IPriceOracleUpgradeable.sol";
import "../interfaces/IWaterTowerUpgradeable.sol";

/// @title Auction Market for whitelisted erc20 tokens
/// @dev  Auction contract allows users sell allowed tokens or buy listed tokens with allowed purchase tokens(stable coins)
///     1. owner allow sell tokens and purchase tokens, and set auction fee
///     2. seller(auctioner) create auction
///     * auction has end time
///     * seller should have enough balance for sell tokens (sell amount + auction fee)
///     3. buyer buy listed tokens immediately or bid with any price in a range
///     * buyer shuold have enough balance for bid tokens (price * buy amount)
///     4. anyone(buyer or seller) close auction after end time

contract AuctionUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using AuctionStorage for AuctionStorage.Layout;
    using TrancheBondStorage for TrancheBondStorage.Layout;
    /// @dev errors
    error InsufficientFee();
    error NotListTrancheZ();

    event AuctionCreated(
        address seller,
        uint256 startTime,
        uint256 duration,
        address indexed sellToken,
        uint256 indexed trancheIndex,
        uint256 sellAmount,
        uint256 minBidAmount,
        uint256 fixedPrice,
        uint256 priceRangeStart,
        uint256 priceRangeEnd,
        AuctionType auctionType,
        AssetType assetType,
        uint256 indexed auctionId
    );

    /// @notice Emitted by auction for buyNow
    /// @param buyer The address call buyNow
    /// @param amountIn Token amount paid by user to buy auctioning token
    /// @param amountOut Auctioning token amount that user received
    /// @param sellToken Auctioning token that auctionor listed to sell
    /// @param purchaseToken token paid by user to buy auctioning token
    /// @param auctionId Id of auction list

    event AuctionBuy(
        address indexed buyer,
        uint256 amountIn,
        uint256 amountOut,
        address indexed sellToken,
        uint256 trancheIndex,
        address purchaseToken,
        uint256 indexed auctionId
    );

    /// @notice Emitted by auction when bidder places a bid
    /// @param bidder The address od bidder
    /// @param amountToBid The auctioning token amount that user want to buy
    /// @param purchaseToken The address of token paid by user to buy auctioning token
    /// @param bidPrice The bid price
    /// @param auctionId The id of auction list
    /// @param bidId The id of bid list

    event AuctionBid(
        address indexed bidder,
        uint256 amountToBid,
        address purchaseToken,
        uint256 bidPrice,
        uint256 indexed auctionId,
        uint256 indexed bidId
    );

    /// @notice Emitted by auction when bidder or auctioneer closes a auction
    /// @param unSoldAmount Amount of unsold auctioning token
    /// @param auctionId Auction id
    event AuctionClosed(uint256 unSoldAmount, uint256 indexed auctionId);

    uint256 public constant FEE_DENOMINATOR = 1000;
    // when auction is closed, max 200 bids with highest price can be settled
    uint256 public constant MAX_CHECK_BID_COUNT = 200;

    function createAuction(
        uint96 startTime,
        uint96 duration,
        address sellToken,
        uint256 trancheIndex,
        uint128 sellAmount,
        uint128 minBidAmount,
        uint128 fixedPrice,
        uint128 priceRangeStart,
        uint128 priceRangeEnd,
        AuctionType auctionType
    ) external payable returns (uint256) {
        uint256 _trancheIndex = trancheIndex;
        if (_trancheIndex == 0) {
            TransferHelper.safeTransferFrom(
                sellToken,
                msg.sender,
                address(this),
                (uint256(sellAmount) * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                    FEE_DENOMINATOR
            );
        } else {
            if(_trancheIndex & 3 == 3) revert NotListTrancheZ();
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                msg.sender,
                address(this),
                trancheIndex,
                uint256(sellAmount),
                Constants.EMPTY
            );
            /// @dev fee is calculated from usd value, and notation amount is BDV
            uint256 beanPrice = IPriceOracleUpgradeable(address(this)).getPrice(Constants.BEAN);
            uint256 feeAmount = (((sellAmount * beanPrice) / 1e18) *
                AuctionStorage.layout().feeNumerator) / FEE_DENOMINATOR;
            if (msg.value < feeAmount) revert InsufficientFee();
            else if (msg.value > feeAmount) payable(msg.sender).transfer(msg.value - feeAmount);
            IWaterTowerUpgradeable(address(this)).addETHReward{value: feeAmount}();
        }
        require(sellAmount > 0, "cannot zero sell amount");
        require(startTime == 0 || startTime >= block.timestamp, "start time must be in the future");
        require(minBidAmount > 0 && minBidAmount <= sellAmount, "invalid minBidAmount");

        AuctionStorage.layout().currentAuctionId = AuctionStorage.layout().currentAuctionId + 1;
        uint96 _startTime = startTime == 0 ? uint96(block.timestamp) : startTime;
        uint96 _duration = duration;
        address _sellToken = sellToken;
        uint128 _sellAmount = sellAmount;
        uint128 _minBidAmount = minBidAmount;
        uint128 _fixedPrice = fixedPrice;
        uint128 _priceRangeStart = priceRangeStart;
        uint128 _priceRangeEnd = priceRangeEnd;
        AuctionType _auctionType = auctionType;
        AssetType _assetType = _trancheIndex == 0 ? AssetType.ERC20 : AssetType.Tranche;

        AuctionData memory auction = AuctionData(
            msg.sender,
            _startTime,
            _duration,
            _sellToken,
            _trancheIndex,
            _sellAmount,
            _minBidAmount,
            _fixedPrice,
            _priceRangeStart,
            _priceRangeEnd,
            _sellAmount,
            0,
            AuctionStatus.Open,
            _auctionType,
            _assetType
        );
        AuctionStorage.layout().auctions[AuctionStorage.layout().currentAuctionId] = auction;
        emit AuctionCreated(
            msg.sender,
            _startTime,
            _duration,
            _sellToken,
            _trancheIndex,
            _sellAmount,
            _minBidAmount,
            _fixedPrice,
            _priceRangeStart,
            _priceRangeEnd,
            _auctionType,
            _assetType,
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
        uint128 availableAmount = auction.reserve;
        uint256 trancheIndex = auction.trancheIndex;
        require(purchaseAmount <= availableAmount, "big amount");

        // need auction conditions
        // consider decimals of purchase token and sell token
        uint256 payAmount = getPayAmount(
            purchaseToken,
            purchaseAmount,
            auction.fixedPrice,
            auction.sellToken
        );
        AuctionStorage.layout().auctions[auctionId].reserve = availableAmount - purchaseAmount;
        TransferHelper.safeTransferFrom(purchaseToken, msg.sender, auction.seller, payAmount);

        if (auction.assetType == AssetType.ERC20) {
            TransferHelper.safeTransfer(auction.sellToken, msg.sender, purchaseAmount);
        } else {
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                address(this),
                msg.sender,
                trancheIndex,
                purchaseAmount,
                Constants.EMPTY
            );
        }

        emit AuctionBuy(
            msg.sender,
            payAmount,
            purchaseAmount,
            auction.sellToken,
            auction.trancheIndex,
            purchaseToken,
            auctionId
        );
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
        checkAuctionInProgress(
            uint256(auction.startTime + auction.duration),
            uint256(auction.startTime)
        );
        require(auction.minBidAmount <= bidAmount, "too small bid amount");
        require(bidAmount <= auction.reserve, "too big amount than reverse");
        // should add condition for timed
        // no bid
        if (auction.curBidId == 0) {
            require(bidPrice >= auction.priceRangeStart, "low Bid");
        } else {
            Bid memory lastBid = AuctionStorage.layout().bids[auctionId][auction.curBidId];
            require(bidPrice > lastBid.bidPrice, "low Bid");
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
        AuctionStorage.layout().bids[auctionId][currentBidId] = bid;
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
        _settleAuction(auctionId);
    }

    function claimForCanceledBid(uint256 auctionId, uint256 bidId) external {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        Bid memory bid = AuctionStorage.layout().bids[auctionId][bidId];
        require(auction.status == AuctionStatus.Closed, "no closed auction");
        require(bid.bidder == msg.sender, "bidder only can claim");
        require(!bid.bCleared, "already settled bid");
        TransferHelper.safeTransfer(
            bid.purchaseToken,
            bid.bidder,
            getPayAmount(bid.purchaseToken, bid.bidAmount, bid.bidPrice, auction.sellToken)
        );
        AuctionStorage.layout().bids[auctionId][bidId].bCleared = true;
    }

    function _settleAuction(uint256 auctionId) internal {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint256 trancheIndex = auction.trancheIndex;
        // when there are no bids, all token amount will be transfered back to seller
        if (auction.curBidId == 0) {
            if (trancheIndex == 0) {
                TransferHelper.safeTransfer(auction.sellToken, auction.seller, auction.reserve);
            } else {
                IERC1155Upgradeable(address(this)).safeTransferFrom(
                    address(this),
                    auction.seller,
                    trancheIndex,
                    auction.reserve,
                    Constants.EMPTY
                );
            }

            AuctionStorage.layout().auctions[auctionId].reserve = 0;
            AuctionStorage.layout().auctions[auctionId].status = AuctionStatus.Closed;
            emit AuctionClosed(auction.reserve, auctionId);
            return;
        }
        uint128 availableAmount = auction.reserve;
        uint256 settledBidCount = 0;
        uint256 curBidId = auction.curBidId;
        do {
            Bid memory bid = AuctionStorage.layout().bids[auctionId][curBidId];
            uint128 settledAmount = _settleBid(
                auction.sellToken,
                auction.trancheIndex,
                auction.seller,
                bid,
                availableAmount
            );
            availableAmount -= settledAmount;
            AuctionStorage.layout().bids[auctionId][curBidId].bCleared = true;
            --curBidId;
            ++settledBidCount;
        } while (
            curBidId > 0 &&
                settledBidCount <= MAX_CHECK_BID_COUNT &&
                availableAmount >= auction.minBidAmount
        );
        if (availableAmount > 0) {
            if (auction.assetType == AssetType.ERC20) {
                TransferHelper.safeTransfer(auction.sellToken, auction.seller, availableAmount);
            } else {
                IERC1155Upgradeable(address(this)).safeTransferFrom(
                    address(this),
                    auction.seller,
                    trancheIndex,
                    availableAmount,
                    Constants.EMPTY
                );
            }
        }

        AuctionStorage.layout().auctions[auctionId].reserve = 0;
        AuctionStorage.layout().auctions[auctionId].status = AuctionStatus.Closed;
        emit AuctionClosed(availableAmount, auctionId);
    }

    /// @notice transfer autioning token to bidder and transfer puchase token to seller
    function _settleBid(
        address sellToken,
        uint256 trancheIndex,
        address seller,
        Bid memory bid,
        uint128 availableAmount
    ) internal returns (uint128 settledAmount) {
        settledAmount = bid.bidAmount;
        uint128 repayAmount = 0;
        if (availableAmount < settledAmount) {
            repayAmount = settledAmount - availableAmount;
            settledAmount = availableAmount;
            TransferHelper.safeTransfer(
                bid.purchaseToken,
                bid.bidder,
                getPayAmount(bid.purchaseToken, repayAmount, bid.bidPrice, sellToken)
            );
        }
        if (trancheIndex == 0) {
            TransferHelper.safeTransfer(sellToken, bid.bidder, settledAmount);
        } else {
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                address(this),
                bid.bidder,
                trancheIndex,
                settledAmount,
                Constants.EMPTY
            );
        }

        TransferHelper.safeTransfer(
            bid.purchaseToken,
            seller,
            getPayAmount(bid.purchaseToken, settledAmount, bid.bidPrice, sellToken)
        );
    }

    // admin setters
    // enable or disable purchase tokens
    function setPurchaseToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedPurchaseTokens[_token] = _bEnable;
    }

    // enable or diable sell tokens
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
    function getAuctionFee() public view returns (uint256 numerator, uint256 dominator) {
        numerator = AuctionStorage.layout().feeNumerator;
        dominator = FEE_DENOMINATOR;
    }

    function getPayAmount(
        address purchaseToken,
        uint128 purchaseAmount,
        uint128 price,
        address sellToken
    ) public view returns (uint256) {
        uint256 denominator = (10 **
            (18 -
                IERC20MetadataUpgradeable(purchaseToken).decimals() +
                (sellToken != address(0) ? IERC20MetadataUpgradeable(sellToken).decimals() : 18)));
        return FullMath.mulDivRoundingUp128(purchaseAmount, price, denominator);
    }

    function getAuction(uint256 auctionId) public view returns (AuctionData memory) {
        return AuctionStorage.layout().auctions[auctionId];
    }

    function getBid(uint256 auctionId, uint256 bidId) public view returns (Bid memory) {
        return AuctionStorage.layout().bids[auctionId][bidId];
    }

    function getAuctionsCount() public view returns (uint256 totalAuctionsCount) {
        return AuctionStorage.layout().currentAuctionId;
    }

    function isSupportedPurchaseToken(address tokenAddress) external view returns (bool) {
        return AuctionStorage.layout().supportedPurchaseTokens[tokenAddress];
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
    function checkAuctionInProgress(uint endTime, uint startTime) internal view {
        require(_checkAuctionRangeTime(endTime, startTime), "auction is inactive");
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
