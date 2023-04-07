// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/// @title TrancheNotation Interface

interface ITrancheNotationUpgradeable {
    /// @dev Events
    event TranferTrancheNotation(
        uint256 trancheIndex,
        uint256 amount,
        address indexed from,
        address indexed to
    );

    /// @notice Transfer tranche token
    /// @dev    Only owner of tranche and irrigation contract can transfer tranche token
    function transferFromTrNotation(
        uint256 trancheIndex,
        uint256 amount,
        address from,
        address to
    ) external;

    function mintTrNotation(uint256 trancheIndex, uint256 amount, address minter) external;

    /// @dev Get functions
    /// @notice get user tranche token balance
    function balanceOfTrNotation(
        uint256 trancheIndex,
        address account
    ) external view returns (uint256);
}