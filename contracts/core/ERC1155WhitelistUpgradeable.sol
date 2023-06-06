// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/security/PausableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC1155ReceiverUpgradeable.sol";

import "./ERC1155WhitelistStorage.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/FullMath.sol";
import "../libraries/Constants.sol";
import "../interfaces/IPodsOracleUpgradeable.sol";
import "../interfaces/IERC1155WhitelistUpgradeable.sol";

/// @title ERC1155WhitelistUpgradeable Contract
/// @dev Users can hold this tranche tokens, and redeem underlying assets after maturity date.
///      We don't want our tranche tokens used out on random dex or other protocol,
///      so this tranche token can be available on markets in whitelist

contract ERC1155WhitelistUpgradeable is
    IERC1155WhitelistUpgradeable,
    IERC1155ReceiverUpgradeable,
    ERC1155SupplyUpgradeable,
    ERC1155BurnableUpgradeable,
    EIP2535Initializable,
    IrrigationAccessControl
{
    using ERC1155WhitelistStorage for ERC1155WhitelistStorage.Layout;
    uint256 public constant DECIMALS = 18;
    error NoWhitelist();
    error NoUserMint();
    error BlacklistedToken();

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
            from != msg.sender && ERC1155WhitelistStorage.layout().proxySpenders[operator].name == 0
        ) revert NoWhitelist();
        uint256 length = ids.length;
        for (uint256 i = 0; i < length; ) {
            if (ERC1155WhitelistStorage.layout().proxySpenders[operator].blacklisted[i])
                revert BlacklistedToken();
            unchecked {
                i++;
            }
        }
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerableUpgradeable, ERC1155Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return (ERC1155Upgradeable.supportsInterface(interfaceId) ||
            AccessControlEnumerableUpgradeable.supportsInterface(interfaceId) ||
            (LibDiamond.diamondStorage().supportedInterfaces[interfaceId] == true));
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

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure override returns (bytes4) {
        (operator);
        (from);
        (id);
        (value);
        (data); // solidity, be quiet please
        // require(address(this) == proxy, "Direct call: onERC1155Received");
        return Constants.ERC1155_ACCEPTED;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure override returns (bytes4) {
        (operator);
        (from);
        (ids);
        (values);
        (data); // solidity, be quiet please
        return Constants.ERC1155_BATCH_ACCEPTED;
    }

    /// @dev get functions
    function getProxyInfo(address proxySpender) external view returns (bytes32) {
        return ERC1155WhitelistStorage.layout().proxySpenders[proxySpender].name;
    }

    function isTradeableToken(address proxySpender, uint256 tokenId) external view returns (bool) {
        return
            ERC1155WhitelistStorage.layout().proxySpenders[proxySpender].name != 0 &&
            ERC1155WhitelistStorage.layout().proxySpenders[proxySpender].blacklisted[tokenId];
    }

    /// @dev Admin functions
    /// @notice Add proxy contract into whitelist
    /// @param contractAddress spender contract address
    /// @param name spender name
    function addProxySpender(address contractAddress, bytes32 name) external onlySuperAdminRole {
        ERC1155WhitelistStorage.layout().proxySpenders[contractAddress].name = name;
    }

    /// @notice Remove proxy contract into whitelist
    /// @param contractAddress spender contract addres
    function removeProxySpender(address contractAddress) external onlySuperAdminRole {
        ERC1155WhitelistStorage.layout().proxySpenders[contractAddress].name = 0;
    }

    /// @notice Manage blacklist
    /// @param proxyAddress proxy contract to update
    /// @param tokenIds token id array to update blacklist
    /// @param bBlacklisted true if want to include in blacklist, or not
    function updateTokenInBlacklist(
        address proxyAddress,
        uint256[] memory tokenIds,
        bool bBlacklisted
    ) external onlySuperAdminRole {
        uint256 length = tokenIds.length;
        for (uint256 i = 0; i < length; ) {
            ERC1155WhitelistStorage.layout().proxySpenders[proxyAddress].blacklisted[
                    i
                ] = bBlacklisted;
            unchecked {
                i++;
            }
        }
    }
}
