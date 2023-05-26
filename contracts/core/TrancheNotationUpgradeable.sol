// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TrancheNotationStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/ITrancheNotationUpgradeable.sol";

/// @title TrancheNotation Contract
/// @dev Users can hold this tranche tokens, and redeem pods after maturity date.
///      We don't want our tranche tokens used out on random dex or other protocol,
///      so this tranche token doesn't support erc20 interface
///      We call tranche token as TrNotation

contract TrancheNotationUpgradeable is
    ITrancheNotationUpgradeable,
    EIP2535Initializable,
    IrrigationAccessControl
{
    using TrancheNotationStorage for TrancheNotationStorage.Layout;
    uint256 public constant TRNOTAION_DECIMALS = 18;

    /// @dev Errors
    error InvalidToAddress();
    error InsufficientTrancheNotation();
    error CallOutIrrigation();

    /// @notice Transfer tranche token
    /// @dev    Only owner of tranche can transfer tranche token
    function transferFromTrNotation(
        uint256 trancheIndex,
        uint256 amount,
        address from,
        address to
    ) external {
        /// should call inside this contract or by sender as same as from
        if (to == address(0) || (msg.sender != from && msg.sender != address(this)))
            revert InvalidToAddress();
        uint256 fromBalance = TrancheNotationStorage.layout().balances[trancheIndex][from];
        if (fromBalance < amount) revert InsufficientTrancheNotation();
        unchecked {
            TrancheNotationStorage.layout().balances[trancheIndex][from] -= amount;
        }
        TrancheNotationStorage.layout().balances[trancheIndex][to] += amount;
        emit TranferTrancheNotation(trancheIndex, amount, from, to);
    }

    function mintTrNotation(uint256 trancheIndex, uint256 amount, address minter) external {
        if (msg.sender != address(this)) revert CallOutIrrigation();
        TrancheNotationStorage.layout().balances[trancheIndex][minter] += amount;
        TrancheNotationStorage.layout().totalSupplies[trancheIndex] += amount;
        emit TranferTrancheNotation(trancheIndex, amount, address(0), minter);
    }

    function burnTrNotation(uint256 trancheIndex, address user) external {
        if (msg.sender != address(this)) revert CallOutIrrigation();
        uint256 userBalance = TrancheNotationStorage.layout().balances[trancheIndex][user];
        TrancheNotationStorage.layout().totalSupplies[trancheIndex] -= userBalance;
        TrancheNotationStorage.layout().balances[trancheIndex][user] = 0;
        emit TranferTrancheNotation(trancheIndex, userBalance, user, address(0));
    }

    /// @dev Get functions
    /// @notice get user tranche token balance
    function balanceOfTrNotation(
        uint256 trancheIndex,
        address account
    ) public view returns (uint256) {
        return TrancheNotationStorage.layout().balances[trancheIndex][account];
    }

    function getTotalSupply(uint256 trancheIndex) external view returns (uint256) {
        return TrancheNotationStorage.layout().totalSupplies[trancheIndex];
    }
}
