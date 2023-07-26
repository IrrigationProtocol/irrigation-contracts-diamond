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
    // / @param bidder The address od bidder
    // / @param amountToBid The auctioning token amount that user want to buy
    // / @param purchaseToken The address of token paid by user to buy auctioning token
    // / @param bidPrice The bid price
    /// @param auctionId The id of auction list
    /// @param bidId The id of bid list

    event AuctionBid(
        Bid bid,
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
    uint96 internal constant MAX_DURATION = 180 days;
    uint96 internal constant MIN_DURATION = 1 minutes;

    function createAuction(
        AuctionSetting memory auctionSetting
    ) external payable returns (uint256) {
        if (auctionSetting.bidTokenGroupId >= AuctionStorage.layout().countOfTokenGroups)
            revert InvalidBidToken();
        if (
            auctionSetting.minBidAmount == 0 ||
            auctionSetting.minBidAmount > auctionSetting.sellAmount
        ) revert InvalidMinBidAmount();
        if (auctionSetting.maxWinners == 0) revert InvalidMaxWinners();
        if (auctionSetting.priceRangeStart > auctionSetting.priceRangeEnd) revert InvalidEndPrice();
        if (auctionSetting.startTime == 0) {
            auctionSetting.startTime = uint96(block.timestamp);
            auctionSetting.endTime += auctionSetting.startTime;
        } else if (auctionSetting.startTime < block.timestamp) revert InvalidStartTime();
        if (
            auctionSetting.endTime <= auctionSetting.startTime + MIN_DURATION ||
            auctionSetting.endTime >= auctionSetting.startTime + MAX_DURATION
        ) revert InvalidAuction();

        _receiveAuctionAsset(
            auctionSetting.sellAmount,
            auctionSetting.sellToken,
            auctionSetting.trancheIndex
        );
        uint256 auctionId = AuctionStorage.layout().currentAuctionId + 1;
        AuctionStorage.layout().currentAuctionId = auctionId;
        auctionSetting.reserve = auctionSetting.sellAmount;
        AuctionStorage.layout().auctions[auctionId].s = auctionSetting;
        AuctionStorage.layout().auctions[auctionId].seller = msg.sender;
        emit AuctionCreated(auctionSetting, msg.sender, auctionId);
        return auctionId;
    }

    function _receiveAuctionAsset(
        uint256 sellAmount,
        address sellToken,
        uint256 trancheIndex
    ) internal {
        if (trancheIndex == 0) {
            IERC20Upgradeable(sellToken).safeTransferFrom(
                msg.sender,
                address(this),
                (uint256(sellAmount) * (FEE_DENOMINATOR + AuctionStorage.layout().feeNumerator)) /
                    FEE_DENOMINATOR
            );
        } else {
            if (trancheIndex & 3 == 3) revert NotListTrancheZ();
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
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        if (auction.seller != msg.sender) revert NoAuctioneer();
        if (
            auction.status != AuctionStatus.Open ||
            auction.s.endTime < block.timestamp ||
            auction.curBidId != 0
        ) revert NoIdleAuction();

        if (priceRangeStart > auction.s.priceRangeEnd) revert InvalidEndPrice();

        if (minBidAmount != 0 && minBidAmount <= auction.s.sellAmount)
            AuctionStorage.layout().auctions[auctionId].s.minBidAmount = minBidAmount;
        if (priceRangeStart != 0)
            AuctionStorage.layout().auctions[auctionId].s.priceRangeStart = priceRangeStart;
        // once incrementBidPrice is set into no-zero value, it can't be updated into zero
        if (incrementBidPrice != 0)
            AuctionStorage.layout().auctions[auctionId].s.incrementBidPrice = incrementBidPrice;
        emit AuctionUpdate(auctionId, minBidAmount, priceRangeStart, incrementBidPrice);
    }

    function buyNow(
        uint256 auctionId,
        uint128 purchaseAmount,
        // IERC20Upgradeable purchaseToken,
        uint16 buyTokenId
    ) external nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        address _purchaseToken = AuctionStorage.layout().bidTokenGroups[auction.s.bidTokenGroupId].bidTokens[buyTokenId];
        if (_purchaseToken == address(0)) revert InvalidBidToken();
        if (auction.s.auctionType == AuctionType.TimedAuction || auction.seller == address(0))
            revert InvalidAuction();
        checkAuctionInProgress(auction.s.endTime, auction.s.startTime);
        uint128 availableAmount = auction.s.reserve;
        uint256 trancheIndex = auction.s.trancheIndex;
        if (purchaseAmount > availableAmount) revert InsufficientReserveAsset();

        
        // need auction conditions
        // consider decimals of purchase token and sell token
        uint256 payAmount = getPayAmount(
            _purchaseToken,
            purchaseAmount,
            auction.s.fixedPrice,
            auction.s.sellToken
        );
        unchecked {
            AuctionStorage.layout().auctions[auctionId].s.reserve =
                availableAmount -
                purchaseAmount;
        }
        IERC20Upgradeable(_purchaseToken).safeTransferFrom(msg.sender, auction.seller, payAmount);

        if (auction.s.trancheIndex == 0) {
            IERC20Upgradeable(auction.s.sellToken).safeTransfer(msg.sender, purchaseAmount);
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
            auction.s.sellToken,
            auction.s.trancheIndex,
            _purchaseToken,
            auctionId
        );
    }

    function placeBid(
        uint256 auctionId,
        uint128 bidAmount,
        // address purchaseToken,
        uint16 bidTokenId,
        uint128 bidPrice,
        bool bCheckEndPrice
    ) external /* supportedPurchase(purchaseToken) */ nonReentrant returns (uint256) {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        address _purchaseToken = AuctionStorage.layout().bidTokenGroups[auction.s.bidTokenGroupId].bidTokens[bidTokenId];
        if (_purchaseToken == address(0)) revert InvalidBidToken();        
        if (auction.s.auctionType == AuctionType.FixedPrice) revert InvalidAuction();
        checkAuctionInProgress(auction.s.endTime, auction.s.startTime);
        if (auction.s.minBidAmount > bidAmount) revert SmallBidAmount();
        if (bidAmount > auction.s.reserve) revert InsufficientReserveAsset();
        // should add condition for timed
        // last bid price starts from priceRangeStart
        uint128 availableBidPrice = auction.curBidId == 0
            ? auction.s.priceRangeStart
            : AuctionStorage.layout().bids[auctionId][auction.curBidId].bidPrice +
                auction.s.incrementBidPrice;
        // if bidPrice is 0, place bid in increment way
        // if incrementBidPrice is 0, can place bid with same price as last bid
        if (bidPrice == 0) bidPrice = availableBidPrice;
        else if (bidPrice < availableBidPrice) revert LowBid();
        if (bCheckEndPrice && auction.s.priceRangeEnd < bidPrice) revert OverPriceBid();
        // address _purchaseToken = purchaseToken;
        uint128 _bidPrice = bidPrice;
        uint256 payAmount = getPayAmount(_purchaseToken, bidAmount, _bidPrice, auction.s.sellToken);
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
        auction.curBidId = uint128(currentBidId);
        {
            uint256 gasRemaining = gasleft();
            uint256 _auctionId = auctionId;
            uint128 _bidAmount = bidAmount;
            AuctionStorage.layout().bids[_auctionId][currentBidId] = bid;
            uint256 availableBidDepth = uint256(auction.availableBidDepth) + 1;
            uint128 totalBidAmount = auction.totalBidAmount + _bidAmount;
            address[] memory bidTokens = AuctionStorage.layout().bidTokenGroups[auction.s.bidTokenGroupId].bidTokens;
            // cancel bids not eligible in a range of gas limit
            while (true) {
                uint256 _cancelBidId = currentBidId - availableBidDepth + 1;
                Bid memory cancelBid = AuctionStorage.layout().bids[_auctionId][_cancelBidId];
                // even though reserve sell amount is smaller than bidAmount, settle the bid and the bidder receives sell token as possible
                if (
                    availableBidDepth <= uint256(auction.s.maxWinners) + 1 &&
                    totalBidAmount < auction.s.reserve + cancelBid.bidAmount
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
                bid,
                _auctionId,
                currentBidId
            );
        }
        return currentBidId;
    }

    function closeAuction(uint256 auctionId) external nonReentrant {
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        require(
            block.timestamp >= auction.s.endTime && auction.status != AuctionStatus.Closed,
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
            uint256 reserve = auction.s.reserve;
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
            AuctionStorage.layout().bidTokenGroups[auction.s.bidTokenGroupId].bidTokens[bid.bidTokenId]
        );
        if (isWinner) {
            AuctionStorage.layout().auctions[auctionId].s.reserve =
                auction.s.reserve -
                uint128(claimAmount);
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

    function _settleAuction(uint256 auctionId) internal {
        uint256 gasLimit = gasleft();
        AuctionData memory auction = AuctionStorage.layout().auctions[auctionId];
        uint256 trancheIndex = auction.s.trancheIndex;
        uint128 availableAmount = auction.s.reserve;
        uint256 settledBidCount;
        uint256 curBidId = auction.curBidId;
        address[] memory bidTokens = AuctionStorage.layout().bidTokenGroups[auction.s.bidTokenGroupId].bidTokens;
        uint256[] memory payoutAmounts = new uint256[](bidTokens.length);
        bool bOverGasLimit = false;
        uint128 reserve = availableAmount;
        while (curBidId > 0 && settledBidCount <= auction.s.maxWinners && reserve > 0) {
            Bid memory bid = AuctionStorage.layout().bids[auctionId][curBidId];
            if (bid.status != BidStatus.Bid) break;
            if (!bOverGasLimit && gasLimit <= gasleft() + CLOSE_GAS_LIMIT) {
                AuctionStorage.layout().bids[auctionId][curBidId].status = BidStatus.Cleared;
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
        // console.log("--setteled count: %s, %s %s", settledBidCount, curBidId, availableAmount);
        if (auction.totalBidAmount < auction.s.reserve) {
            uint128 refundAmount;
            unchecked {
                refundAmount = auction.s.reserve - auction.totalBidAmount;
            }
            if (auction.s.trancheIndex == 0) {
                IERC20Upgradeable(auction.s.sellToken).safeTransfer(
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
        AuctionStorage.layout().auctions[auctionId].s.reserve = availableAmount;
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
                uint128(settledBidCount);
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
    // function setPurchaseToken(address _token, bool _bEnable) external onlySuperAdminRole {
    //     AuctionStorage.layout().bidTokenData[_token].isEnabled = _bEnable;
    //     address[] memory bidTokens = AuctionStorage.layout().bidTokens;
    //     uint256 i;
    //     for (i = 0; i < bidTokens.length; ) {
    //         if (bidTokens[i] == _token) {
    //             break;
    //         }
    //         unchecked {
    //             ++i;
    //         }
    //     }
    //     if (i == bidTokens.length) {
    //         AuctionStorage.layout().bidTokens.push(_token);
    //         AuctionStorage.layout().bidTokenData[_token].id = uint16(i);
    //     }
    // }

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

    function AddBidTokenGroup(BidTokenGroup memory bidTokenGroup) external onlySuperAdminRole {
        uint256 count = AuctionStorage.layout().countOfTokenGroups;
        _updateTokenGroup(count, bidTokenGroup);
        AuctionStorage.layout().countOfTokenGroups = count + 1;
    }

    function updateTokenGroup(
        uint256 tokenGroupId,
        BidTokenGroup memory bidTokenGroup
    ) external onlySuperAdminRole {
        _updateTokenGroup(tokenGroupId, bidTokenGroup);
    }

    function _updateTokenGroup(uint256 tokenGroupId, BidTokenGroup memory bidTokenGroup) internal {
        AuctionStorage.layout().bidTokenGroups[tokenGroupId] = bidTokenGroup;
        for (uint256 i; i < bidTokenGroup.bidTokens.length; ) {
            AuctionStorage.layout().bidTokenData[bidTokenGroup.bidTokens[i]].id = uint16(i);
            unchecked {
                ++i;
            }
        }
    }

    // getters
    function getAuctionFee() external view returns (uint256 numerator, uint256 dominator) {
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

    /// @dev returns true if auction in progress, false otherwise
    function checkAuctionInProgress(uint endTime, uint startTime) internal view {
        if (startTime > block.timestamp || (endTime > 0 && endTime <= block.timestamp))
            revert InactiveAuction();
    }
    
}
