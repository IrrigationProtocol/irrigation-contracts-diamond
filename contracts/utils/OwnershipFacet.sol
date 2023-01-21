// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC173Upgradeable } from "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC173Upgradeable.sol";

contract OwnershipFacet is IERC173Upgradeable {
    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
    }

    function owner() external override view returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }
}
