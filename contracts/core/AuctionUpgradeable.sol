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
// import "../utils/IrrigationAccessControl.sol";
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
///     4. anyone(buyer, seller, or any) close auction after end time

contract AuctionUpgradeable is EIP2535Initializable, ReentrancyGuardUpgradeable {
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
    error InvalidSellToken();
    error InvalidMaxWinners();
    error NoClosedAuction();
    error NoAuction();
    error InvalidAuction();
    error InactiveAuction();
    error NoAuctioneer();
    error NoIdleAuction();
    error InvalidPurchaseAmount();
    // bid and buy
    error LowBid();
    error OverPriceBid();
    error NoCancelBid();
    error ClaimedBid();
    error NoBidder();
    error SmallBidAmount();
    error InvalidBidToken();

    event AuctionCreated(
        AuctionSetting auctionSetting,
        address indexed seller,
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
    /// @param bid bid token struct
    /// @param auctionId The id of auction list
    /// @param bidId The id of bid list

    event AuctionBid(Bid bid, uint256 indexed auctionId, uint256 indexed bidId);

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

    uint256 internal constant FEE_DENOMINATOR = 1000;
    uint256 internal constant BID_GAS_LIMIT = 470000;
    uint256 internal constant CLOSE_GAS_LIMIT = 180000;

    function createAuction(AuctionSetting memory auctionSetting, uint8 periodId) external payable {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        if (!auctionStorage.supportedSellTokens[auctionSetting.sellToken])
            revert InvalidSellToken();
        if (auctionSetting.bidTokenGroupId >= auctionStorage.countOfTokenGroups)
            revert InvalidBidToken();
        if (
            auctionSetting.minBidAmount == 0 ||
            auctionSetting.minBidAmount > auctionSetting.sellAmount
        ) revert InvalidMinBidAmount();
        if (auctionSetting.maxWinners == 0) revert InvalidMaxWinners();
        if (auctionSetting.priceRangeStart > auctionSetting.priceRangeEnd) revert InvalidEndPrice();
        if (auctionSetting.startTime == 0) auctionSetting.startTime = uint48(block.timestamp);
        else if (auctionSetting.startTime < block.timestamp) revert InvalidStartTime();
        auctionSetting.endTime = auctionSetting.startTime + auctionStorage.periods[periodId];
        uint256 auctionId = auctionStorage.currentAuctionId + 1;
        // receive auction asset
        if (auctionSetting.trancheIndex == 0) {
            IERC20Upgradeable(auctionSetting.sellToken).safeTransferFrom(
                msg.sender,
                address(this),
                (auctionSetting.sellAmount * (FEE_DENOMINATOR + auctionStorage.feeNumerator)) /
                    FEE_DENOMINATOR
            );
        } else {
            if (auctionSetting.trancheIndex & 3 == 3) revert NotListTrancheZ();
            if (auctionSetting.sellToken != address(this)) revert InvalidTrancheAuction();
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                msg.sender,
                address(this),
                auctionSetting.trancheIndex,
                auctionSetting.sellAmount,
                Constants.EMPTY
            );
            /// @dev fee is calculated from usd value, and notation amount is BDV
            uint256 ethPrice = IPriceOracleUpgradeable(address(this)).getUnderlyingPriceETH();
            // tranche nft decimals is 6 and price decimals 18
            uint256 feeAmount = (((auctionSetting.sellAmount * 1e30) / ethPrice) *
                auctionStorage.feeNumerator) / FEE_DENOMINATOR;
            if (msg.value < feeAmount) revert InsufficientFee();
            else if (msg.value > feeAmount) {
                (bool success, ) = msg.sender.call{value: msg.value - feeAmount}("");
                if (!success) revert NoTransferEther();
            }
            auctionStorage.auctions[auctionId].feeAmount = feeAmount;
        }
        auctionStorage.currentAuctionId = auctionId;
        auctionSetting.reserve = auctionSetting.sellAmount;
        auctionStorage.auctions[auctionId].s = auctionSetting;
        auctionStorage.auctions[auctionId].seller = msg.sender;
        emit AuctionCreated(auctionSetting, msg.sender, auctionId);
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
        uint128 incrementBidPrice
    ) external {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        AuctionData memory auction = auctionStorage.auctions[auctionId];
        if (auction.seller != msg.sender) revert NoAuctioneer();
        if (
            auction.status != AuctionStatus.Open ||
            auction.s.endTime < block.timestamp ||
            auction.curBidId != 0
        ) revert NoIdleAuction();

        if (priceRangeStart > auction.s.priceRangeEnd) revert InvalidEndPrice();

        if (minBidAmount != 0 && minBidAmount <= auction.s.sellAmount)
            auctionStorage.auctions[auctionId].s.minBidAmount = minBidAmount;
        if (priceRangeStart != 0)
            auctionStorage.auctions[auctionId].s.priceRangeStart = priceRangeStart;
        // once incrementBidPrice is set into no-zero value, it can't be updated into zero
        if (incrementBidPrice != 0)
            auctionStorage.auctions[auctionId].s.incrementBidPrice = incrementBidPrice;
        emit AuctionUpdate(auctionId, minBidAmount, priceRangeStart, incrementBidPrice);
    }

    /// @notice buy token immediately with fixed price
    /// @param auctionId      auction id
    /// @param purchaseAmount amount to purchase
    /// @param buyTokenId     token id to buy with
    function buyNow(
        uint256 auctionId,
        uint128 purchaseAmount,
        uint16 buyTokenId
    ) external nonReentrant {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        AuctionData memory auction = auctionStorage.auctions[auctionId];
        if (auction.s.auctionType == AuctionType.TimedAuction || auction.seller == address(0))
            revert InvalidAuction();
        address _purchaseToken = AuctionStorage
            .layout()
            .bidTokenGroups[auction.s.bidTokenGroupId]
            .bidTokens[buyTokenId];
        checkAuctionInProgress(auction.s.endTime, auction.s.startTime);
        uint128 availableAmount = auction.s.reserve;
        uint256 trancheIndex = auction.s.trancheIndex;
        if (purchaseAmount > availableAmount) revert InsufficientReserveAsset();
        if (auction.s.minBidAmount > purchaseAmount) revert SmallBidAmount();

        unchecked {
            auctionStorage.auctions[auctionId].s.reserve = availableAmount - purchaseAmount;
        }
        uint8 sellTokenDecimals;
        if (trancheIndex == 0) {
            sellTokenDecimals = IERC20MetadataUpgradeable(auction.s.sellToken).decimals();
            IERC20Upgradeable(auction.s.sellToken).safeTransfer(msg.sender, purchaseAmount);
        } else {
            sellTokenDecimals = 6;
            IERC1155Upgradeable(address(this)).safeTransferFrom(
                address(this),
                msg.sender,
                trancheIndex,
                purchaseAmount,
                Constants.EMPTY
            );
        }
        uint256 payAmount = getPayAmount(
            _purchaseToken,
            purchaseAmount,
            auction.s.fixedPrice,
            sellTokenDecimals
        );
        IERC20Upgradeable(_purchaseToken).safeTransferFrom(msg.sender, auction.seller, payAmount);

        emit AuctionBuy(
            msg.sender,
            payAmount,
            purchaseAmount,
            auction.s.sellToken,
            trancheIndex,
            _purchaseToken,
            auctionId
        );
    }

    function placeBid(
        uint256 auctionId,
        uint128 bidAmount,
        uint16 bidTokenId,
        uint128 bidPrice,
        bool bCheckEndPrice
    ) external nonReentrant returns (uint256) {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        AuctionData memory auction = auctionStorage.auctions[auctionId];
        if (auction.s.auctionType == AuctionType.FixedPrice || auction.seller == address(0))
            revert InvalidAuction();
        address _purchaseToken = AuctionStorage
            .layout()
            .bidTokenGroups[auction.s.bidTokenGroupId]
            .bidTokens[bidTokenId];
        checkAuctionInProgress(auction.s.endTime, auction.s.startTime);
        if (auction.s.minBidAmount > bidAmount) revert SmallBidAmount();
        if (bidAmount > auction.s.reserve) revert InsufficientReserveAsset();
        // bid price starts from priceRangeStart
        uint128 availableBidPrice = auction.curBidId == 0
            ? auction.s.priceRangeStart
            : auctionStorage.bids[auctionId][auction.curBidId].bidPrice +
                auction.s.incrementBidPrice;
        // if bidPrice is 0, place bid in increment way
        // if incrementBidPrice is 0, can place bid with same price as last bid
        if (bidPrice == 0) bidPrice = availableBidPrice;
        else if (bidPrice < availableBidPrice) revert LowBid();
        if (bCheckEndPrice && auction.s.priceRangeEnd < bidPrice) revert OverPriceBid();
        uint128 _bidPrice = bidPrice;
        uint256 payAmount = getPayAmount(
            _purchaseToken,
            bidAmount,
            _bidPrice,
            auction.s.trancheIndex > 0
                ? 6
                : IERC20MetadataUpgradeable(auction.s.sellToken).decimals()
        );
        IERC20Upgradeable(_purchaseToken).safeTransferFrom(msg.sender, address(this), payAmount);
        Bid memory bid = Bid({
            bidder: msg.sender,
            bidAmount: bidAmount,
            bidPrice: _bidPrice,
            paidAmount: uint128(payAmount),
            bidTokenId: bidTokenId,
            bCleared: false
        });
        uint128 currentBidId = auction.curBidId + 1;
        {
            uint256 gasRemaining = gasleft();
            uint256 _auctionId = auctionId;
            uint128 _bidAmount = bidAmount;
            auctionStorage.bids[_auctionId][currentBidId] = bid;
            uint256 availableBidDepth = uint256(auction.availableBidDepth) + 1;
            uint128 totalBidAmount = auction.totalBidAmount + _bidAmount;
            address[] memory bidTokens = AuctionStorage
                .layout()
                .bidTokenGroups[auction.s.bidTokenGroupId]
                .bidTokens;
            // cancel bids not eligible in a range of gas limit
            while (true) {
                uint256 _cancelBidId = currentBidId - availableBidDepth + 1;
                Bid memory cancelBid = auctionStorage.bids[_auctionId][_cancelBidId];
                // even though reserve sell amount is smaller than bidAmount, settle the bid and the bidder receives sell token as possible
                if (
                    availableBidDepth <= auction.s.maxWinners &&
                    totalBidAmount < auction.s.reserve + cancelBid.bidAmount
                ) break;
                unchecked {
                    totalBidAmount -= cancelBid.bidAmount;
                    availableBidDepth--;
                }
                /// cancel not eligible bids
                if (cancelBid.bCleared) revert NoCancelBid();
                IERC20Upgradeable(bidTokens[cancelBid.bidTokenId]).safeTransfer(
                    cancelBid.bidder,
                    cancelBid.paidAmount
                );
                AuctionStorage.layout().bids[_auctionId][_cancelBidId].bCleared = true;
                if (gasRemaining - gasleft() > BID_GAS_LIMIT) break;
            }
            AuctionStorage.layout().auctions[_auctionId].availableBidDepth = uint8(
                availableBidDepth
            );
            AuctionStorage.layout().auctions[_auctionId].totalBidAmount = totalBidAmount;
            AuctionStorage.layout().auctions[_auctionId].curBidId = currentBidId;
            emit AuctionBid(bid, _auctionId, currentBidId);
        }
        return currentBidId;
    }

    function closeAuction(uint256 auctionId) external nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            block.timestamp >= auction.s.endTime && auction.status != AuctionStatus.Closed,
            "auction can't be closed"
        );
        _settleAuction(auctionId, auction);
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
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        AuctionData memory auction = auctionStorage.auctions[auctionId];
        Bid memory bid = auctionStorage.bids[auctionId][bidId];
        return _isWinnerBid(auctionId, bidId, auction, bid);
    }

    /// @notice claim bid for winner or canceled bid after auction is closed
    function claimBid(uint256 auctionId, uint256 bidId) external nonReentrant {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        AuctionData memory auction = auctionStorage.auctions[auctionId];
        Bid memory bid = auctionStorage.bids[auctionId][bidId];
        (bool isWinner, bool isClaimed, uint256 claimAmount) = _isWinnerBid(
            auctionId,
            bidId,
            auction,
            bid
        );
        if (isClaimed) revert ClaimedBid();
        auctionStorage.bids[auctionId][bidId].bCleared = true;
        // anyone can claim bid, and transfer sell token to bidder, and transfer bid token to seller
        // require(bid.bidder == msg.sender, "bidder only can claim");
        if (auction.status != AuctionStatus.Closed) revert NoClosedAuction();
        IERC20Upgradeable _purchaseToken = IERC20Upgradeable(
            auctionStorage.bidTokenGroups[auction.s.bidTokenGroupId].bidTokens[bid.bidTokenId]
        );
        if (isWinner) {
            auctionStorage.auctions[auctionId].s.reserve = auction.s.reserve - uint128(claimAmount);
            _settleBid(
                auction.s.sellToken,
                auction.s.trancheIndex,
                _purchaseToken,
                bid,
                uint128(claimAmount)
            );
        } else {
            _purchaseToken.safeTransfer(bid.bidder, bid.paidAmount);
        }
    }

    function _settleAuction(uint256 auctionId, AuctionData memory auction) internal {
        uint256 gasLimit = gasleft();
        // uint256 trancheIndex = auction.s.trancheIndex;
        uint128 availableAmount = auction.s.reserve;
        uint256 settledBidCount;
        uint256 curBidId = auction.curBidId;
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        address[] memory bidTokens = auctionStorage
            .bidTokenGroups[auction.s.bidTokenGroupId]
            .bidTokens;
        uint256[] memory payoutAmounts = new uint256[](bidTokens.length);
        bool bOverGasLimit = false;
        uint128 reserve = availableAmount;
        while (curBidId > 0 && settledBidCount <= auction.s.maxWinners && reserve > 0) {
            Bid memory bid = auctionStorage.bids[auctionId][curBidId];
            if (bid.bCleared) break;
            if (!bOverGasLimit && gasLimit <= gasleft() + CLOSE_GAS_LIMIT) {
                auctionStorage.bids[auctionId][curBidId].bCleared = true;
                (uint128 settledAmount, uint128 payoutAmount) = _settleBid(
                    auction.s.sellToken,
                    auction.s.trancheIndex,
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
        /// transfer auction fee
        if (auction.s.sellAmount > reserve) {
            uint256 totalSettledAmount;
            unchecked {
                totalSettledAmount = auction.s.sellAmount - reserve;
            }
            if (totalSettledAmount > 0) {
                if (auction.s.trancheIndex == 0) {
                    IERC20Upgradeable(auction.s.sellToken).safeTransfer(
                        auctionStorage.feeReceiver,
                        (totalSettledAmount * auctionStorage.feeNumerator) / FEE_DENOMINATOR
                    );
                } else {
                    IWaterTowerUpgradeable(address(this)).addETHReward{
                        value: (auction.feeAmount * totalSettledAmount) / auction.s.sellAmount
                    }();
                }
            }
        }
        if (reserve > 0) {
            unchecked {
                availableAmount -= reserve;
            }
            if (auction.s.trancheIndex == 0) {
                IERC20Upgradeable(auction.s.sellToken).safeTransfer(
                    auction.seller,
                    (reserve * (FEE_DENOMINATOR + auctionStorage.feeNumerator)) / FEE_DENOMINATOR
                );
            } else {
                IERC1155Upgradeable(address(this)).safeTransferFrom(
                    address(this),
                    auction.seller,
                    auction.s.trancheIndex,
                    reserve,
                    Constants.EMPTY
                );
                (bool sent, ) = payable(auction.seller).call{
                    value: ((reserve * auction.feeAmount) / auction.s.sellAmount) / FEE_DENOMINATOR
                }("");
                require(sent, "failed to send ether");
            }
        }
        auctionStorage.auctions[auctionId].s.reserve = availableAmount;
        auctionStorage.auctions[auctionId].status = AuctionStatus.Closed;

        unchecked {
            auctionStorage.auctions[auctionId].availableBidDepth =
                auction.availableBidDepth -
                uint8(settledBidCount);
            auctionStorage.auctions[auctionId].totalBidAmount =
                auction.totalBidAmount -
                availableAmount;
            auctionStorage.auctions[auctionId].curBidId =
                auction.curBidId -
                uint128(settledBidCount);
        }
        emit AuctionClosed(availableAmount, auctionId, auction.curBidId, curBidId);
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

    function _isWinnerBid(
        uint256 auctionId,
        uint256 bidId,
        AuctionData memory auction,
        Bid memory bid
    ) internal view returns (bool isWinner, bool isClaimed, uint256 claimAmount) {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        if (bid.bCleared) isClaimed = true;
        if (auction.status != AuctionStatus.Closed) {
            return (false, isClaimed, 0);
        } else {
            uint256 curBidId = auction.curBidId;
            uint256 reserve = auction.s.reserve;
            unchecked {
                while (curBidId > bidId && reserve > 0) {
                    Bid memory seniorBid = auctionStorage.bids[auctionId][curBidId];
                    if (!seniorBid.bCleared) {
                        if (reserve > seniorBid.bidAmount) {
                            reserve -= seniorBid.bidAmount;
                        } else reserve = 0;
                    }
                    --curBidId;
                }
                if (reserve > 0) {
                    return (
                        true,
                        isClaimed,
                        reserve >= bid.bidAmount ? bid.bidAmount : bid.bidAmount - reserve
                    );
                } else return (false, isClaimed, 0);
            }
        }
    }

    // admin setters are implemented in IrrigationControl

    // getters
    function getAuctionFee() external view returns (uint256 numerator, uint256 dominator) {
        numerator = AuctionStorage.layout().feeNumerator;
        dominator = FEE_DENOMINATOR;
    }

    function getPayAmount(
        address purchaseToken,
        uint128 purchaseAmount,
        uint128 price,
        uint8 sellTokenDecimals
    ) public view returns (uint256) {
        uint256 denominator = (10 **
            (18 - IERC20MetadataUpgradeable(purchaseToken).decimals() + sellTokenDecimals));
        return FullMath.mulDivRoundingUp128(purchaseAmount, price, denominator);
    }

    function getAuction(uint256 auctionId) external view returns (AuctionData memory) {
        return AuctionStorage.layout().auctions[auctionId];
    }

    function getBid(uint256 auctionId, uint256 bidId) external view returns (Bid memory) {
        return AuctionStorage.layout().bids[auctionId][bidId];
    }

    function getAuctionsCount() external view returns (uint256 totalAuctionsCount) {
        return AuctionStorage.layout().currentAuctionId;
    }

    function getBidTokenGroup(
        uint256 tokenGroupId
    ) external view returns (BidTokenGroup memory tokenGroup) {
        return AuctionStorage.layout().bidTokenGroups[tokenGroupId];
    }

    function getBidTokenGroupCount() external view returns (uint256 countOfTokenGroup) {
        return AuctionStorage.layout().countOfTokenGroups;
    }

    function getAuctionPeriods() external view returns (uint48[] memory) {
        return AuctionStorage.layout().periods;
    }

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(uint256 endTime, uint256 startTime) internal view {
        if (startTime > block.timestamp || (endTime > 0 && endTime <= block.timestamp))
            revert InactiveAuction();
    }
}
