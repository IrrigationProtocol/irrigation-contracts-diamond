// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./TrancheBondStorage.sol";
import "./TrancheTokenStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";

/// @title TrancheToken Contract
/// @dev Users can hold this tranche tokens, and redeem pods after maturity date.
///      We don't want our tranche tokens used out on random dex or other protocol,
///      so this tranche token doesn't support erc20 interface
///      We call tranche token as TrToken

contract TrancheTokenUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using TrancheTokenStorage for TrancheTokenStorage.Layout;
    using TrancheBondStorage for TrancheBondStorage.Layout;
    uint256 public constant TT_DECIMALS = 18;

    /// @dev Events
    event TranferTrancheToken(
        uint256 trancheIndex,
        uint256 amount,
        address indexed from,
        address indexed to
    );
    /// @dev Errors
    error InvalidToAddress();
    error InsufficientTrancheToken();

    /// @notice Transfer tranche token
    function transferTrToken(
        uint256 trancheIndex,
        uint256 amount,
        address to
    ) public {
        /// @dev users can send tranche token only in our protoco.
        if (to == address(0)) revert InvalidToAddress();
        uint256 fromBalance = TrancheTokenStorage.layout().balances[trancheIndex][msg.sender];
        if (fromBalance < amount) revert InsufficientTrancheToken();
        unchecked {
            TrancheTokenStorage.layout().balances[trancheIndex][msg.sender] -= amount;
        }
        TrancheTokenStorage.layout().balances[trancheIndex][to] += amount;
    }

    /// @dev Get functions
    /// @notice get user tranche token balance
    function balanceOfTT(uint256 trancheIndex, address account) public view returns (uint256) {
        return TrancheTokenStorage.layout().balances[trancheIndex][account];
    }
}
