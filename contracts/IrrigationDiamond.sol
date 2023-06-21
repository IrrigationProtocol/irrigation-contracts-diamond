// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IDiamondLoupe.sol";
import "./interfaces/IDiamondCut.sol";
import "./utils/Diamond.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/utils/introspection/ERC165StorageUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/IERC1155Upgradeable.sol";
import "./utils/EIP2535Initializable.sol";

contract IrrigationDiamond is Diamond, ERC165StorageUpgradeable, EIP2535Initializable {
    using LibDiamond for LibDiamond.DiamondStorage;    

    constructor(
        address _contractOwner,
        address _diamondCutFacet
    ) payable EIP2535Initializer Diamond(_contractOwner, _diamondCutFacet) {
        __ERC165Storage_init();
        // this is so that any contract deployment watchers will be able to check interfaces on deployment
        _registerInterface(type(IERC165Upgradeable).interfaceId);
        _registerInterface(type(IERC20Upgradeable).interfaceId);
        _registerInterface(type(IERC1155Upgradeable).interfaceId);
        _registerInterface(type(IDiamondCut).interfaceId);
        _registerInterface(type(IDiamondLoupe).interfaceId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            super.supportsInterface(interfaceId) ||
            LibDiamond.diamondStorage().supportedInterfaces[interfaceId];
    }

    // Finalize initialization after every facet has initialized only
    function FinalizeInitialization() external {
        require(LibDiamond.diamondStorage().contractOwner == msg.sender, "Only SuperAdmin allowed");
        InitializableStorage.layout()._initialized = 1;
    }

    function FinalReinitialize(uint8 version) external {
        require(LibDiamond.diamondStorage().contractOwner == msg.sender, "Only SuperAdmin allowed");
        InitializableStorage.layout()._initialized = version;
    }

    receive() external payable {}
}
