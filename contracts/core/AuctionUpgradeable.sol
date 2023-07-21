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

// import "hardhat/console.sol";

/// @title Auction Market for whitelisted erc20 tokens
/// @dev  Auction contract allows users sell allowed tokens or buy listed tokens with allowed purchase tokens(stable coins)
///     1. owner allow sell tokens and purchase tokens, and set auction fee
///     2. seller(auctioner) create auction
///     * auction has end time
///     * seller should have enough balance for sell tokens (sell amount + auction fee)
///     3. buyer buy listed tokens immediately or bid with any price in a range
///     * buyer shuold have enough balance for bid tokens (price * buy amount)
///     4. anyone(buyer, seller, or any) close auction after end time

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
    error InsufficientReserveAsset();
    error NotListTrancheZ();
    error NoTransferEther();
    error InvalidTrancheAuction();
    error InvalidAuctionAmount();
    error InvalidStartTime();
    error InvalidMinBidAmount();
    error InvalidEndPrice();
    error InvalidMaxWinners();
    error NoClosedAuction();
    error NoAuction();
    error InvalidAuction();
    error InactiveAuction();
    error NoAuctioneer();
    error NoIdleAuction();
    error InvalidPurchaseAmount();
    // bid
    error LowBid();
    error OverPriceBid();
    error NoCancelBid();
    error ClaimedBid();
    error NoBidder();
    error SmallBidAmount();

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
    event AuctionClosed(
        uint256 unSoldAmount,
        uint256 indexed auctionId,
        uint256 curBidId,
        uint256 lastWinnerBidId
    );

    event AuctionUpdate(
        uint indexed auctionId,
        uint minBidAmount,
        uint priceRangeStart,
        uint incrementPrice
    );

    event ClaimBid(uint indexed auctionId, uint indexed bidId, uint claimAmount);

    uint256 internal constant FEE_DENOMINATOR = 1000;
    uint256 internal constant BID_GAS_LIMIT = 460000;
    uint256 internal constant CLOSE_GAS_LIMIT = 200000;

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

        if (minBidAmount == 0 || minBidAmount > sellAmount) revert InvalidMinBidAmount();
        if (maxWinners == 0) revert InvalidMaxWinners();
        if (priceRangeStart > priceRangeEnd) revert InvalidEndPrice();

        AuctionStorage.layout().currentAuctionId += 1;
        uint96 _startTime;
        if (startTime == 0) _startTime = uint96(block.timestamp);
        else if (startTime < block.timestamp) revert InvalidStartTime();
        else _startTime = startTime;
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
            _startTime + _duration,
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

    /// @notice update important options of auction before any bidding
    /// @param auctionId auction id
    /// @param minBidAmount min bid amount to update
    /// @param priceRangeStart start price
    /// @param incrementBidPrice increment bid price
    function updateAuction(
        uint256 auctionId,
        uint128 minBidAmount,
        uint128 priceRangeStart,
        uint96 incrementBidPrice
    ) external {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        if (auction.seller != msg.sender) revert NoAuctioneer();
        if (
            auction.status != AuctionStatus.Open ||
            auction.endTime < block.timestamp ||
            auction.curBidId != 0
        ) revert NoIdleAuction();

        if (minBidAmount > auction.sellAmount) revert InvalidMinBidAmount();
        if (priceRangeStart > auction.priceRangeEnd) revert InvalidEndPrice();

        if (minBidAmount != 0)
            AuctionStorage.layout().auctions[auctionId].minBidAmount = minBidAmount;
        if (priceRangeStart != 0)
            AuctionStorage.layout().auctions[auctionId].priceRangeStart = priceRangeStart;
        // once incrementBidPrice is set into no-zero value, it can't be updated into zero
        if (incrementBidPrice != 0)
            AuctionStorage.layout().auctions[auctionId].incrementBidPrice = incrementBidPrice;
        emit AuctionUpdate(auctionId, minBidAmount, priceRangeStart, incrementBidPrice);
    }

    function buyNow(
        uint256 auctionId,
        uint128 purchaseAmount,
        IERC20Upgradeable purchaseToken
    ) external supportedPurchase(address(purchaseToken)) nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        if (auction.auctionType == AuctionType.TimedAuction || auction.seller == address(0))
            revert InvalidAuction();
        checkAuctionInProgress(auction.endTime, auction.startTime);
        uint128 availableAmount = auction.reserve;
        uint256 trancheIndex = auction.trancheIndex;
        if (purchaseAmount > availableAmount) revert InsufficientReserveAsset();

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
    ) external supportedPurchase(purchaseToken) nonReentrant returns (uint256) {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        if (auction.auctionType == AuctionType.FixedPrice) revert InvalidAuction();
        checkAuctionInProgress(auction.endTime, auction.startTime);
        if (auction.minBidAmount > bidAmount) revert SmallBidAmount();
        if (bidAmount > auction.reserve) revert InsufficientReserveAsset();
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
            // purchaseToken: _purchaseToken,
            paidAmount: uint128(payAmount),
            bidTokenId: AuctionStorage.layout().bidTokenData[_purchaseToken].id,
            status: BidStatus.Bid
        });
        uint256 currentBidId = auction.curBidId + 1;
        auction.curBidId = currentBidId;
        {
            uint256 gasRemaining = gasleft();
            uint256 _auctionId = auctionId;
            uint128 _bidAmount = bidAmount;
            AuctionStorage.layout().bids[_auctionId][currentBidId] = bid;
            uint256 availableBidDepth = uint256(auction.availableBidDepth) + 1;
            uint128 totalBidAmount = auction.totalBidAmount + _bidAmount;
            address[] memory bidTokens = AuctionStorage.layout().bidTokens;
            // cancel bids not eligible in a range of gas limit
            while (true) {
                uint256 _cancelBidId = currentBidId - availableBidDepth + 1;
                Bid memory cancelBid = AuctionStorage.layout().bids[_auctionId][_cancelBidId];
                // even though reserve sell amount is smaller than bidAmount, settle the bid and the bidder receives sell token as possible
                if (
                    availableBidDepth <= uint256(auction.maxWinners) + 1 &&
                    totalBidAmount < auction.reserve + cancelBid.bidAmount
                ) break;
                totalBidAmount -= cancelBid.bidAmount;
                availableBidDepth--;
                _cancelBid(cancelBid, _auctionId, _cancelBidId, bidTokens[cancelBid.bidTokenId]);
                if (gasRemaining - gasleft() > BID_GAS_LIMIT) break;
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
            currentTime >= auction.endTime && auction.status != AuctionStatus.Closed,
            "auction can't be closed"
        );
        _settleAuction(auctionId);
    }

    /// @notice function to get status of bid
    /// @param auctionId auction id
    /// @param bidId  bid id
    /// @return isWinner true if the bid is winner
    /// @return isClaimed true if the bid was claimed

    function isWinnerBid(
        uint256 auctionId,
        uint256 bidId
    ) public view returns (bool isWinner, bool isClaimed, uint256 claimAmount) {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        Bid memory bid = AuctionStorage.layout().bids[auctionId][bidId];
        if (bid.status == BidStatus.Cleared) isClaimed = true;
        if (auction.status != AuctionStatus.Closed) {
            return (false, isClaimed, 0);
        } else {
            uint256 curBidId = auction.curBidId;
            uint256 reserve = auction.reserve;
            while (curBidId > bidId && reserve > 0) {
                Bid memory seniorBid = AuctionStorage.layout().bids[auctionId][curBidId];
                if (seniorBid.status != BidStatus.Cleared) {
                    if (reserve > seniorBid.bidAmount) {
                        unchecked {
                            reserve -= seniorBid.bidAmount;
                        }
                    } else reserve = 0;
                }
                unchecked {
                    --curBidId;
                }
            }
            if (reserve > 0)
                return (
                    true,
                    isClaimed,
                    reserve >= bid.bidAmount ? bid.bidAmount : bid.bidAmount - reserve
                );
            else return (false, isClaimed, 0);
        }
    }

    /// @notice claim bid for winner or canceled bid after auction is closed
    function claimBid(uint256 auctionId, uint256 bidId) external nonReentrant {
        (bool isWinner, bool isClaimed, uint256 claimAmount) = isWinnerBid(auctionId, bidId);
        if (isClaimed) revert ClaimedBid();
        AuctionStorage.layout().bids[auctionId][bidId].status = BidStatus.Cleared;
        Bid memory bid = AuctionStorage.layout().bids[auctionId][bidId];
        // anyone can claim bid, and transfer sell token to bidder, and transfer bid token to seller
        // require(bid.bidder == msg.sender, "bidder only can claim");
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        if (auction.status != AuctionStatus.Closed) revert NoClosedAuction();
        IERC20Upgradeable _purchaseToken = IERC20Upgradeable(
            AuctionStorage.layout().bidTokens[bid.bidTokenId]
        );
        if (isWinner) {
            AuctionStorage.layout().auctions[auctionId].reserve =
                auction.reserve -
                uint128(claimAmount);
            _settleBid(
                auction.sellToken,
                auction.trancheIndex,
                _purchaseToken,
                bid,
                uint128(claimAmount)
            );
        } else {
            _purchaseToken.safeTransfer(bid.bidder, bid.paidAmount);
        }
    }

    function _settleAuction(uint256 auctionId) internal {
        uint256 gasLimit = gasleft();
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint256 trancheIndex = auction.trancheIndex;
        uint128 availableAmount = auction.reserve;
        uint256 settledBidCount = 0;
        uint256 curBidId = auction.curBidId;
        address[] memory bidTokens = AuctionStorage.layout().bidTokens;
        uint256[] memory payoutAmounts = new uint256[](bidTokens.length);
        bool bOverGasLimit = false;
        uint128 reserve = availableAmount;
        while (curBidId > 0 && settledBidCount <= auction.maxWinners && reserve > 0) {
            Bid memory bid = AuctionStorage.layout().bids[auctionId][curBidId];
            if (bid.status != BidStatus.Bid) break;
            if (!bOverGasLimit && gasLimit <= gasleft() + CLOSE_GAS_LIMIT) {
                AuctionStorage.layout().bids[auctionId][curBidId].status = BidStatus.Cleared;
                (uint128 settledAmount, uint128 payoutAmount) = _settleBid(
                    auction.sellToken,
                    auction.trancheIndex,
                    IERC20Upgradeable(bidTokens[bid.bidTokenId]),
                    bid,
                    availableAmount
                );
                payoutAmounts[bid.bidTokenId] += payoutAmount;
                availableAmount -= settledAmount;
                reserve -= settledAmount;
                ++settledBidCount;
            } else {
                if (!bOverGasLimit) bOverGasLimit = true; // it allows the calculation for gas limit done only one time
                if (bid.bidAmount >= reserve) {
                    payoutAmounts[bid.bidTokenId] +=
                        (bid.paidAmount * (bid.bidAmount - reserve)) /
                        bid.bidAmount;
                    reserve = 0;
                } else {
                    reserve -= bid.bidAmount;
                    payoutAmounts[bid.bidTokenId] += bid.paidAmount;
                }
            }
            --curBidId;
        }
        uint256 i;
        /// transfer paid token from contract to seller
        for (i; i < bidTokens.length; ) {
            uint256 payoutAmount = payoutAmounts[i];
            if (payoutAmount > 0) {
                IERC20Upgradeable(bidTokens[i]).safeTransfer(auction.seller, payoutAmount);
            }
            unchecked {
                ++i;
            }
        }
        // console.log("--setteled count: %s, %s %s", settledBidCount, curBidId, availableAmount);
        if (auction.totalBidAmount < auction.reserve) {
            uint128 refundAmount;
            unchecked {
                refundAmount = auction.reserve - auction.totalBidAmount;
            }
            if (auction.trancheIndex == 0) {
                IERC20Upgradeable(auction.sellToken).safeTransfer(
                    auction.seller,
                    (refundAmount * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                        FEE_DENOMINATOR
                );
            } else {
                IERC1155Upgradeable(address(this)).safeTransferFrom(
                    address(this),
                    auction.seller,
                    trancheIndex,
                    refundAmount,
                    Constants.EMPTY
                );
            }
            availableAmount -= refundAmount;
            // AuctionStorage.layout().auctions[auctionId].reserve -= 0;
        } else {}
        AuctionStorage.layout().auctions[auctionId].reserve = availableAmount;
        AuctionStorage.layout().auctions[auctionId].status = AuctionStatus.Closed;

        unchecked {
            AuctionStorage.layout().auctions[auctionId].availableBidDepth =
                auction.availableBidDepth -
                uint8(settledBidCount);
            AuctionStorage.layout().auctions[auctionId].totalBidAmount =
                auction.totalBidAmount -
                availableAmount;
            emit AuctionClosed(availableAmount, auctionId, auction.curBidId, curBidId);
            AuctionStorage.layout().auctions[auctionId].curBidId =
                auction.curBidId -
                settledBidCount;
        }
    }

    /// @notice transfer auctioning token to bidder
    function _settleBid(
        address sellToken,
        uint256 trancheIndex,
        IERC20Upgradeable _purchaseToken,
        Bid memory bid,
        uint128 availableAmount
    ) internal returns (uint128 settledAmount, uint128 payoutAmount) {
        settledAmount = bid.bidAmount;
        payoutAmount = bid.paidAmount;
        if (availableAmount < settledAmount) {
            uint128 repayAmount;
            unchecked {
                repayAmount = settledAmount - availableAmount;
            }
            // calculate as payout token
            repayAmount = (repayAmount * bid.paidAmount) / bid.bidAmount;
            payoutAmount -= repayAmount;
            settledAmount = availableAmount;
            _purchaseToken.safeTransfer(bid.bidder, repayAmount);
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
    }

    /// @notice cancel a bid and transfer purchase token to the bidder back
    function _cancelBid(
        Bid memory bid,
        uint256 auctionId,
        uint256 bidId,
        address bidToken
    ) internal {
        if (bid.status != BidStatus.Bid) revert NoCancelBid();
        IERC20Upgradeable(bidToken).safeTransfer(bid.bidder, bid.paidAmount);
        AuctionStorage.layout().bids[auctionId][bidId].status = BidStatus.Cleared;
    }

    // admin setters
    // enable or disable purchase tokens
    function setPurchaseToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().bidTokenData[_token].isEnabled = _bEnable;
        address[] memory bidTokens = AuctionStorage.layout().bidTokens;
        uint256 i;
        for (i = 0; i < bidTokens.length; ) {
            if (bidTokens[i] == _token) {
                break;
            }
            unchecked {
                ++i;
            }
        }
        if (i == bidTokens.length) {
            AuctionStorage.layout().bidTokens.push(_token);
            AuctionStorage.layout().bidTokenData[_token].id = uint16(i);
        }
    }

    // enable or diable sell tokens
    function setSellToken(address _token, bool _bEnable) external onlySuperAdminRole {
        AuctionStorage.layout().supportedSellTokens[_token] = _bEnable;
    }

    function setAuctionFee(
        uint256 _newFeeNumerator,
        address _newfeeReceiver
    ) external onlySuperAdminRole {
        if (_newFeeNumerator > 25) revert(); // "Fee higher than 2.5%");
        // caution: for currently running auctions, the feeReceiver is changing as well.
        AuctionStorage.layout().feeReceiver = _newfeeReceiver;
        AuctionStorage.layout().feeNumerator = _newFeeNumerator;
    }

    // function AddBidTokenGroup(
    //     bytes32 name,
    //     address[] memory bidTokens,
    //     address basePriceToken
    // ) external onlySuperAdminRole {
    //     uint256 count = AuctionStorage.layout().countOfTokenGroups + 1;
    //     _updateTokenGroup(count, name, bidTokens, basePriceToken);
    //     AuctionStorage.layout().countOfTokenGroups = count;
    // }

    // function updateTokenGroup(
    //     uint256 tokenGroupId,
    //     bytes32 name,
    //     address[] memory bidTokens,
    //     address basePriceToken
    // ) external onlySuperAdminRole {
    //     _updateTokenGroup(tokenGroupId, name, bidTokens, basePriceToken);
    // }

    // function _updateTokenGroup(
    //     uint256 tokenGroupId,
    //     bytes32 name,
    //     address[] memory bidTokens,
    //     address basePriceToken
    // ) internal {
    //     for (uint256 i; i < bidTokens.length; ) {
    //         AuctionStorage.layout().bidTokenGroups[tokenGroupId].bidTokens[i] = bidTokens[i];
    //         unchecked {
    //             i++;
    //         }
    //     }
    //     AuctionStorage.layout().bidTokenGroups[tokenGroupId].name = name;
    //     AuctionStorage.layout().bidTokenGroups[tokenGroupId].count = uint8(bidTokens.length);
    //     AuctionStorage.layout().bidTokenGroups[tokenGroupId].basePriceToken = basePriceToken;
    // }

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
        return AuctionStorage.layout().bidTokenData[tokenAddress].isEnabled;
    }

    // modifiers
    modifier supportedPurchase(address tokenAddress) {
        require(
            AuctionStorage.layout().bidTokenData[tokenAddress].isEnabled,
            "no supported purchase"
        );
        _;
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(uint endTime, uint startTime) internal view {
        if (startTime > block.timestamp || (endTime > 0 && endTime <= block.timestamp))
            revert InactiveAuction();
    }
}
