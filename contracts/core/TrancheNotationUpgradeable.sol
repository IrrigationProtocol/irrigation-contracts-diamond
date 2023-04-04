// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./TrancheBondStorage.sol";
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
    using TrancheBondStorage for TrancheBondStorage.Layout;
    uint256 public constant TRNOTAION_DECIMALS = 18;

    /// @notice Transfer tranche token
    /// @dev    Only owner of tranche can transfer tranche token
    function transferTrNotation(uint256 trancheIndex, uint256 amount, address to) public {
        if (to == address(0)) revert InvalidToAddress();
        uint256 fromBalance = TrancheNotationStorage.layout().balances[trancheIndex][msg.sender];
        if (fromBalance < amount) revert InsufficientTrancheNotation();
        unchecked {
            TrancheNotationStorage.layout().balances[trancheIndex][msg.sender] -= amount;
        }
        TrancheNotationStorage.layout().balances[trancheIndex][to] += amount;
        emit TranferTrancheNotation(trancheIndex, amount, msg.sender, to);
    }

    function mintTrNotation(uint256 trancheIndex, uint256 amount, address minter) public {
        if (minter != address(this)) revert CallOutIrrigation();
        TrancheNotationStorage.layout().balances[trancheIndex][minter] += amount;
        TrancheNotationStorage.layout().totalSupplies[trancheIndex] += amount;
        emit TranferTrancheNotation(trancheIndex, amount, address(0), minter);
    }

    /// @dev Get functions
    /// @notice get user tranche token balance
    function balanceOfTrNotation(uint256 trancheIndex, address account) public view returns (uint256) {
        return TrancheNotationStorage.layout().balances[trancheIndex][account];
    }
}
