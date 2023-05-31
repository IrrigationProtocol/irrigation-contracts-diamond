// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/security/PausableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "./ERC1155WhitelistStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/ITrancheNotationUpgradeable.sol";

/// @title ERC1155WhitelistUpgradeable Contract
/// @dev Users can hold this tranche tokens, and redeem underlying assets after maturity date.
///      We don't want our tranche tokens used out on random dex or other protocol,
///      so this tranche token can be available on markets in whitelist

contract ERC1155WhitelistUpgradeable is
    ERC1155SupplyUpgradeable,
    ERC1155BurnableUpgradeable,
    EIP2535Initializable,
    IrrigationAccessControl
{
    using ERC1155WhitelistStorage for ERC1155WhitelistStorage.Layout;
    uint256 public constant DECIMALS = 18;
    error NoWhitelist();
    error NoUserMint();

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155SupplyUpgradeable, ERC1155Upgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        if (
            from != msg.sender &&
            !ERC1155WhitelistStorage.layout().isWhitelisted[operator] &&
            operator != address(this)
        ) revert NoWhitelist();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC1155Upgradeable, AccessControlEnumerableUpgradeable)
        returns (bool)
    {
        return (ERC1155Upgradeable.supportsInterface(interfaceId) ||
            AccessControlEnumerableUpgradeable.supportsInterface(interfaceId) ||
            (LibDiamond.diamondStorage().supportedInterfaces[interfaceId] == true));
    }

    function updateWhitelist(
        address contractAddress,
        bool bWhitelisted
    ) external onlySuperAdminRole {
        ERC1155WhitelistStorage.layout().isWhitelisted[contractAddress] = bWhitelisted;
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external {
        if (msg.sender != address(this)) revert NoUserMint();
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        if (msg.sender != address(this)) revert NoUserMint();
        _mintBatch(to, ids, amounts, data);
    }
}
