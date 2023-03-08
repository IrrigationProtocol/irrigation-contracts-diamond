// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./BannedTransferorList.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";

abstract contract BanTransferor is IrrigationAccessControl {
    using BannedTransferorList for BannedTransferorList.Layout;

    function banTransferor(address _transferor) public onlySuperAdminRole {
        BannedTransferorList.layout().bannedTransferors[_transferor] = true;
    }

    function allowTransferor(address _transferor) public onlySuperAdminRole {
        delete BannedTransferorList.layout().bannedTransferors[_transferor];
    }

    function isBannedTransferor(address _transferor) public view returns (bool) {
        return BannedTransferorList.layout().bannedTransferors[_transferor];
    }

    modifier onlyAllowedTransferor() {
        require(
            BannedTransferorList.layout().bannedTransferors[msg.sender] != true,
            "Transferor is blocked"
        );
        _;
    }
}
