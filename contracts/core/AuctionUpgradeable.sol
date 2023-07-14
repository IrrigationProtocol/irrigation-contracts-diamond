// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20MetadataUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC1155Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/security/ReentrancyGuardUpgradeable.sol";

import "./AuctionStorage.sol";
import "./TrancheBondStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
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

contract AuctionUpgradeable is
    EIP2535Initializable,
    IrrigationAccessControl,
    ReentrancyGuardUpgradeable
{
    using AuctionStorage for AuctionStorage.Layout;
    using TrancheBondStorage for TrancheBondStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    /// @dev errors
    error InsufficientFee();
    error NotListTrancheZ();
    error NoTransferEther();
    error InvalidTrancheAuction();
    error InvalidAuctionFee();
    error InvalidAuctionAmount();
    error InvalidStartTime();
    error InvalidMinBidAmount();
    error InvalidEndPrice();
    error NoFixedAuction();
    error InvalidPurchaseAmount();
    error LowBid();
    error OverPriceBid();
    error NoCancelBid();

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
        uint96 incrementBidPrice,
        uint8 maxWinners,
        AuctionType auctionType,
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

    uint256 internal constant FEE_DENOMINATOR = 1000;
    uint256 internal constant GAS_LIMIT = 500000;

    function createAuction(
        uint96 startTime,
        uint96 duration,
        IERC20Upgradeable sellToken,
        uint256 trancheIndex,
        uint128 sellAmount,
        uint128 minBidAmount,
        uint128 fixedPrice,
        uint128 priceRangeStart,
        uint128 priceRangeEnd,
        uint96 incrementBidPrice,
        uint8 maxWinners,
        AuctionType auctionType
    ) external payable returns (uint256) {
        uint256 _trancheIndex = trancheIndex;
        if (_trancheIndex == 0) {
            sellToken.safeTransferFrom(
                msg.sender,
                address(this),
                (uint256(sellAmount) * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                    FEE_DENOMINATOR
            );
        } else {
            if (_trancheIndex & 3 == 3) revert NotListTrancheZ();
            if (address(sellToken) != Constants.ZERO) revert InvalidTrancheAuction();
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                msg.sender,
                address(this),
                trancheIndex,
                uint256(sellAmount),
                Constants.EMPTY
            );
            /// @dev fee is calculated from usd value, and notation amount is BDV
            uint256 ethPrice = IPriceOracleUpgradeable(address(this)).getUnderlyingPriceETH();
            // tranche nft decimals is 6 and price decimals 18
            uint256 feeAmount = (((sellAmount * 1e30) / ethPrice) *
                AuctionStorage.layout().feeNumerator) / FEE_DENOMINATOR;
            if (msg.value < feeAmount) revert InsufficientFee();
            else if (msg.value > feeAmount) {
                (bool success, ) = msg.sender.call{value: msg.value - feeAmount}("");
                if (!success) revert NoTransferEther();
            }
            IWaterTowerUpgradeable(address(this)).addETHReward{value: feeAmount}();
        }

        require(startTime == 0 || startTime >= block.timestamp, "start time must be in the future");
        require(minBidAmount > 0 && sellAmount >= minBidAmount, "invalid minBidAmount");
        require(maxWinners > 0, "invalid maxWinners");
        if (priceRangeStart > priceRangeEnd) revert InvalidEndPrice();

        AuctionStorage.layout().currentAuctionId += 1;
        uint96 _startTime = uint96(block.timestamp);
        uint96 _duration = duration;
        uint128 _sellAmount = sellAmount;
        address _sellToken = address(sellToken);
        uint128 _minBidAmount = minBidAmount;
        uint128 _fixedPrice = fixedPrice;
        uint128 _priceRangeStart = priceRangeStart;
        uint128 _priceRangeEnd = priceRangeEnd;
        uint96 _incrementBidPrice = incrementBidPrice;
        AuctionStorage.layout().auctions[AuctionStorage.layout().currentAuctionId] = AuctionData(
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
            _incrementBidPrice,
            0,
            maxWinners,
            0,
            AuctionStatus.Open,
            auctionType
        );
        {
            AuctionType _auctionType = auctionType;
            uint8 _maxWinners = maxWinners;
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
                _incrementBidPrice,
                _maxWinners,
                _auctionType,
                AuctionStorage.layout().currentAuctionId
            );
        }
        return AuctionStorage.layout().currentAuctionId;
    }

    function buyNow(
        uint256 auctionId,
        uint128 purchaseAmount,
        IERC20Upgradeable purchaseToken
    ) external supportedPurchase(address(purchaseToken)) nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            auction.auctionType != AuctionType.TimedAuction && auction.seller != address(0),
            "invalid auction for buyNow"
        );
        uint128 availableAmount = auction.reserve;
        uint256 trancheIndex = auction.trancheIndex;
        require(purchaseAmount <= availableAmount, "big amount");

        address _purchaseToken = address(purchaseToken);
        // need auction conditions
        // consider decimals of purchase token and sell token
        uint256 payAmount = getPayAmount(
            _purchaseToken,
            purchaseAmount,
            auction.fixedPrice,
            auction.sellToken
        );
        unchecked {
            AuctionStorage.layout().auctions[auctionId].reserve = availableAmount - purchaseAmount;
        }
        purchaseToken.safeTransferFrom(msg.sender, auction.seller, payAmount);

        if (auction.trancheIndex == 0) {
            IERC20Upgradeable(auction.sellToken).safeTransfer(msg.sender, purchaseAmount);
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
            _purchaseToken,
            auctionId
        );
    }

    function placeBid(
        uint256 auctionId,
        uint128 bidAmount,
        address purchaseToken,
        uint128 bidPrice,
        bool bCheckEndPrice
    ) external supportedPurchase(purchaseToken) returns (uint256) {
        uint256 gasRemaining = gasleft();
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
        // last bid price starts from priceRangeStart
        uint128 availableBidPrice = auction.curBidId == 0
            ? auction.priceRangeStart
            : AuctionStorage.layout().bids[auctionId][auction.curBidId].bidPrice +
                auction.incrementBidPrice;
        // if bidPrice is 0, place bid in increment way
        // if incrementBidPrice is 0, can place bid with same price as last bid
        if (bidPrice == 0) bidPrice = availableBidPrice;
        else if (bidPrice < availableBidPrice) revert LowBid();
        if (bCheckEndPrice && auction.priceRangeEnd < bidPrice) revert OverPriceBid();
        address _purchaseToken = purchaseToken;
        uint128 _bidPrice = bidPrice;
        uint256 payAmount = getPayAmount(_purchaseToken, bidAmount, _bidPrice, auction.sellToken);
        IERC20Upgradeable(_purchaseToken).safeTransferFrom(msg.sender, address(this), payAmount);
        Bid memory bid = Bid({
            bidder: msg.sender,
            bidAmount: bidAmount,
            bidPrice: _bidPrice,
            purchaseToken: _purchaseToken,
            paidAmount: uint96(payAmount),
            status: BidStatus.BID
        });
        uint256 currentBidId = auction.curBidId + 1;
        auction.curBidId = currentBidId;
        {
            uint256 _auctionId = auctionId;
            uint128 _bidAmount = bidAmount;
            AuctionStorage.layout().bids[_auctionId][currentBidId] = bid;
            uint256 availableBidDepth = uint256(auction.availableBidDepth) + 1;
            uint128 totalBidAmount = auction.totalBidAmount + _bidAmount;
            // cancel bids not eligible in a range of gas limit
            while (true) {
                uint256 _cancelBidId = currentBidId - availableBidDepth + 1;
                Bid memory cancelBid = AuctionStorage.layout().bids[_auctionId][_cancelBidId];
                // even though reserve sell amount is smaller than bidAmount, settle the bid and the bidder receives sell token as possible
                if (
                    availableBidDepth <= uint256(auction.maxWinners) + 1 &&
                    totalBidAmount < auction.sellAmount + cancelBid.bidAmount
                ) break;
                totalBidAmount -= cancelBid.bidAmount;
                availableBidDepth--;
                _cancelBid(cancelBid, _auctionId, _cancelBidId);
                if (gasRemaining - gasleft() > GAS_LIMIT) break;
            }
            auction.availableBidDepth = uint8(availableBidDepth);
            auction.totalBidAmount = totalBidAmount;
            AuctionStorage.layout().auctions[_auctionId] = auction;
            emit AuctionBid(
                msg.sender,
                _bidAmount,
                _purchaseToken,
                _bidPrice,
                _auctionId,
                currentBidId
            );
        }
        return currentBidId;
    }

    function closeAuction(uint256 auctionId) external nonReentrant {
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

    function claimForCanceledBid(uint256 auctionId, uint256 bidId) external nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        Bid memory bid = AuctionStorage.layout().bids[auctionId][bidId];
        require(auction.status == AuctionStatus.Closed, "no closed auction");
        require(bid.bidder == msg.sender, "bidder only can claim");
        require(bid.status != BidStatus.CLEARED, "already settled bid");
        AuctionStorage.layout().bids[auctionId][bidId].status = BidStatus.CLEARED;

        IERC20Upgradeable(bid.purchaseToken).safeTransfer(
            bid.bidder,
            getPayAmount(bid.purchaseToken, bid.bidAmount, bid.bidPrice, auction.sellToken)
        );
    }

    function _settleAuction(uint256 auctionId) internal {
        uint256 gasLimit = gasleft();
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint256 trancheIndex = auction.trancheIndex;
        uint128 availableAmount = auction.reserve;
        uint256 settledBidCount = 0;
        uint256 curBidId = auction.curBidId;
        do {
            Bid memory bid = AuctionStorage.layout().bids[auctionId][curBidId];
            // if (gasLimit - gasleft() <= GAS_LIMIT) {
            uint128 settledAmount = _settleBid(
                auction.sellToken,
                auction.trancheIndex,
                auction.seller,
                bid,
                availableAmount
            );
            availableAmount -= settledAmount;
            AuctionStorage.layout().bids[auctionId][curBidId].status = BidStatus.CLEARED;
            // } else {
            // break;
            // AuctionStorage.layout().bids[auctionId][curBidId].status = BidStatus.WIN;
            // }
            --curBidId;
            ++settledBidCount;
        } while (
            curBidId > 0 &&
                settledBidCount <= auction.maxWinners &&
                gasLimit - gasleft() <= GAS_LIMIT
        );
        if (availableAmount > 0) {
            if (auction.trancheIndex == 0) {
                IERC20Upgradeable(auction.sellToken).safeTransfer(
                    auction.seller,
                    (availableAmount * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                        FEE_DENOMINATOR
                );
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
        IERC20Upgradeable _purchaseToken = IERC20Upgradeable(bid.purchaseToken);
        if (availableAmount < settledAmount) {
            repayAmount = settledAmount - availableAmount;
            settledAmount = availableAmount;
            _purchaseToken.safeTransfer(
                bid.bidder,
                getPayAmount(bid.purchaseToken, repayAmount, bid.bidPrice, sellToken)
            );
        }
        if (trancheIndex == 0) {
            IERC20Upgradeable(sellToken).safeTransfer(bid.bidder, settledAmount);
        } else {
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                address(this),
                bid.bidder,
                trancheIndex,
                settledAmount,
                Constants.EMPTY
            );
        }

        _purchaseToken.safeTransfer(
            seller,
            getPayAmount(bid.purchaseToken, settledAmount, bid.bidPrice, sellToken)
        );
    }

    /// @notice cancel a bid and transfer purchase token to the bidder back
    function _cancelBid(Bid memory bid, uint256 auctionId, uint256 bidId) internal {
        if (bid.status != BidStatus.BID) revert NoCancelBid();
        IERC20Upgradeable _purchaseToken = IERC20Upgradeable(bid.purchaseToken);
        _purchaseToken.safeTransfer(bid.bidder, bid.paidAmount);
        AuctionStorage.layout().bids[auctionId][bidId].status = BidStatus.CLEARED;
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
                (sellToken != address(0) ? IERC20MetadataUpgradeable(sellToken).decimals() : 6)));
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
        if (startTime > currentTime) {
            return false;
        }
        if (endTime > 0 && endTime <= currentTime) {
            return false;
        }
        return true;
    }
}
