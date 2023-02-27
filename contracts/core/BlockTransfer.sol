// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {BlockTransferStorage} from "./BlockTransferStorage.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";

abstract contract BlockTransfer is IrrigationAccessControl {
    using BlockTransferStorage for BlockTransferStorage.Layout;

    function blockTransferor(address _transferor) public onlySuperAdminRole {
        BlockTransferStorage.layout().blockedTransferors[_transferor] = true;
    }

    function unblockTransferor(address _transferor) public onlySuperAdminRole {
        delete BlockTransferStorage.layout().blockedTransferors[_transferor];
    }

    function isTransferorBlocked(address _transferor) public view returns (bool) {
        return BlockTransferStorage.layout().blockedTransferors[_transferor];
    }

    modifier onlyUnBlockedTransfer() {
        require(
            BlockTransferStorage.layout().blockedTransferors[msg.sender] != true,
            "Transferor is blocked"
        );
        _;
    }
}
