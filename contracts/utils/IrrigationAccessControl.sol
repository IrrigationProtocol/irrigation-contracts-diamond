
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/access/AccessControlEnumerableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/proxy/utils/Initializable.sol";
import "../libraries/LibDiamond.sol";

abstract contract IrrigationAccessControl is Initializable, AccessControlEnumerableUpgradeable {

    bytes32 constant public UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    function __IrrigationAccessControl_init() internal onlyInitializing onlySuperAdminRole {
        __AccessControlEnumerable_init_unchained();
        __IrrigationAccessControl_init_unchained();
    }

    function __IrrigationAccessControl_init_unchained() onlyInitializing internal {
        address superAdmin = _msgSender();
        _grantRole(DEFAULT_ADMIN_ROLE, superAdmin);
        _grantRole(UPGRADER_ROLE, superAdmin);
    }

    function grantRole(bytes32 role, address account) public override(IAccessControlUpgradeable, AccessControlUpgradeable) onlySuperAdminRole {
        super.grantRole(role, account);
    }

    function renounceRole(bytes32 role, address account) public override(IAccessControlUpgradeable, AccessControlUpgradeable) onlySuperAdminRole {
        require(!(hasRole(DEFAULT_ADMIN_ROLE, account) && (LibDiamond.diamondStorage().contractOwner == account)), "Cannot renounce superAdmin from Admin Role");
        super.renounceRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override(IAccessControlUpgradeable, AccessControlUpgradeable) onlySuperAdminRole {
        require(!(hasRole(DEFAULT_ADMIN_ROLE, account) && (LibDiamond.diamondStorage().contractOwner == account)), "Cannot revoke superAdmin from Admin Role");
        super.revokeRole(role, account);
    }

    modifier onlySuperAdminRole {
        require(LibDiamond.diamondStorage().contractOwner == msg.sender, "Only SuperAdmin allowed");
        _;
    }

    modifier onlyUpgraderRole {
        require(hasRole(UPGRADER_ROLE, msg.sender), "Account doesn't have upgrader role");
        _;
    }


}
