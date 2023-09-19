// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC173Upgradeable } from "../interfaces/IERC173Upgradeable.sol";
import "./IrrigationAccessControl.sol";

contract OwnershipFacet is IERC173Upgradeable, IrrigationAccessControl {
    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
        // this sets the default admin for every ROLE created
        _grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
    }

    function owner() external override view returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }
}
