// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./AuctionStorage.sol";

import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";

/// @title Admin Facet

contract IrrigationControlUpgradeable is
    EIP2535Initializable,
    IrrigationAccessControl
{
    using AuctionStorage for AuctionStorage.Layout;    
    /// @dev auctions
    event UpdateBidTokenGroup(uint indexed id, BidTokenGroup bidTokenGroup);
    event UpdateSellTokens(address[] sellTokens, bool[] bEnables);
    event UpdateAuctionPeriods(uint96[] periods);

    // admin setters
    // enable or disable sell tokens
    function setSellTokens(
        address[] memory tokens,
        bool[] memory bEnables
    ) external onlySuperAdminRole {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        for (uint256 i; i < tokens.length; ) {
            auctionStorage.supportedSellTokens[tokens[i]] = bEnables[i];
            unchecked {
                ++i;
            }
        }
        emit UpdateSellTokens(tokens, bEnables);
    }

    function setAuctionFee(
        uint256 _newFeeNumerator,
        address _newfeeReceiver
    ) external onlySuperAdminRole {
        AuctionStorage.Layout storage auctionStorage = AuctionStorage.layout();
        if (_newFeeNumerator > 25) revert(); // "Fee higher than 2.5%");
        // caution: for currently running auctions, the feeReceiver is changing as well.
        auctionStorage.feeReceiver = _newfeeReceiver;
        auctionStorage.feeNumerator = _newFeeNumerator;
    }

    function AddBidTokenGroup(BidTokenGroup memory bidTokenGroup) external onlySuperAdminRole {
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
    ) external onlySuperAdminRole {
        _updateTokenGroup(tokenGroupId, bidTokenGroup);
    }

    function _updateTokenGroup(uint256 tokenGroupId, BidTokenGroup memory bidTokenGroup) internal {
        AuctionStorage.layout().bidTokenGroups[tokenGroupId] = bidTokenGroup;
        emit UpdateBidTokenGroup(tokenGroupId, bidTokenGroup);
    }

    function updatePeriods(uint96[] memory periods) external onlySuperAdminRole {
        AuctionStorage.layout().periods = periods;
        emit UpdateAuctionPeriods(periods);
    }
}
