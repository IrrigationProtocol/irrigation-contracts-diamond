// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./AuctionStorage.sol";

import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/security/PausableUpgradeable.sol";
import "../libraries/Constants.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @title Admin Facet
contract IrrigationControlUpgradeable is
    EIP2535Initializable,
    IrrigationAccessControl,
    PausableUpgradeable
{
    using AuctionStorage for AuctionStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev auctions
    event UpdateBidTokenGroup(uint indexed id, BidTokenGroup bidTokenGroup);
    event UpdateSellTokens(address[] sellTokens, bool[] bEnables);
    event UpdateAuctionPeriods(uint48[] periods);
    event WithdrawAuctionFee(address indexed token, address to, uint256 fee);
    event UpdateAuctionFee(AuctionFee fee);
    event UpdateFeeForWT(uint256 percentage);

    /// @dev errors
    error NoWithdrawEtherFee();

    function initAuctionFee() external EIP2535Reinitializer(2) onlyAdminRole {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        // set default auction listing fee 1% and success fee 1.5%
        auctionStorage.fee.limits = [1e26];
        auctionStorage.fee.listingFees = [10000];
        auctionStorage.fee.successFees = [15000];
        emit UpdateAuctionFee(auctionStorage.fee);
        // 25% of listing fee is added to water tower as reward
        auctionStorage.feeForTower = 250000;
        emit UpdateFeeForWT(250000);
    }

    // admin setters
    // enable or disable sell tokens
    function setSellTokens(address[] memory tokens, bool[] memory bEnables) external onlyAdminRole {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        for (uint256 i; i < tokens.length; ) {
            auctionStorage.supportedSellTokens[tokens[i]] = bEnables[i];
            unchecked {
                ++i;
            }
        }
        emit UpdateSellTokens(tokens, bEnables);
    }

    function setAuctionFee(AuctionFee calldata fee) external onlyAdminRole {
        AuctionStorage.layout().fee = fee;
        emit UpdateAuctionFee(fee);
    }

    function setFeeForWaterTower(uint256 fee) external onlyAdminRole {
        AuctionStorage.layout().feeForTower = fee;
        emit UpdateFeeForWT(fee);
    }

    function AddBidTokenGroup(BidTokenGroup memory bidTokenGroup) public onlyAdminRole {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        uint256 count = auctionStorage.countOfTokenGroups;
        _updateTokenGroup(count, bidTokenGroup);
        unchecked {
            auctionStorage.countOfTokenGroups = count + 1;
        }
    }

    function updateTokenGroup(
        uint256 tokenGroupId,
        BidTokenGroup memory bidTokenGroup
    ) external onlyAdminRole {
        _updateTokenGroup(tokenGroupId, bidTokenGroup);
    }

    function _updateTokenGroup(uint256 tokenGroupId, BidTokenGroup memory bidTokenGroup) internal {
        AuctionStorage.layout().bidTokenGroups[tokenGroupId] = bidTokenGroup;
        emit UpdateBidTokenGroup(tokenGroupId, bidTokenGroup);
    }

    function updatePeriods(uint48[] memory periods) external onlyAdminRole {
        AuctionStorage.layout().periods = periods;
        emit UpdateAuctionPeriods(periods);
    }

    /// @dev pausable
    function pause() external onlySuperAdminRole {
        _pause();
    }

    function unpause() external onlySuperAdminRole {
        _unpause();
    }

    function withdrawAuctionFee(
        address token,
        address to,
        uint256 amount
    ) external onlySuperAdminRole {
        AuctionStorage.layout().reserveFees[token] -= amount;
        if (token == Constants.ETHER) {
            (bool success, ) = to.call{value: amount}(new bytes(0));
            if (!success) revert NoWithdrawEtherFee();
        } else {
            IERC20Upgradeable(token).safeTransfer(to, amount);
        }
        emit WithdrawAuctionFee(token, to, amount);
    }
}
