// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { WaterTowerStorage } from "./WaterTowerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";

contract WaterTowerUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using WaterTowerStorage for WaterTowerStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Claimed(address indexed user, uint amount);

    uint256 constant DECIMALS = 1e18;

    function deposit(uint amount) external {
        IERC20Upgradeable(address(this)).safeTransferFrom(msg.sender, address(this), amount);

        _deposit(msg.sender, amount);
    }

    function withdraw(uint amount) external {
        IERC20Upgradeable(address(this)).safeTransfer(msg.sender, amount);

        _withdraw(msg.sender, amount);
    }

    function claim(uint amount) external {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[msg.sender];
        curUserInfo.pending += WaterTowerStorage.layout().sharePerWater * curUserInfo.amount - curUserInfo.debt;

        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;

        if (amount == type(uint).max) {
            amount = curUserInfo.pending / DECIMALS;
        }
        curUserInfo.pending -= amount * DECIMALS;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Claim failed");

        emit Claimed(msg.sender, amount);
    }

    function compound(uint amount) external {}

    // can't call app storage in this function 
    receive() external payable {}

    function _deposit(address user, uint amount) internal {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[user];
        curUserInfo.pending += WaterTowerStorage.layout().sharePerWater * curUserInfo.amount - curUserInfo.debt;

        curUserInfo.amount += amount;
        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;
        WaterTowerStorage.layout().totalDeposits += amount;
        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[user];
        curUserInfo.pending += WaterTowerStorage.layout().sharePerWater * curUserInfo.amount - curUserInfo.debt;

        curUserInfo.amount -= amount;
        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;
        WaterTowerStorage.layout().totalDeposits -= amount;
        emit Withdrawn(user, amount);
    }

    // generated getter for usersInfos
    function userInfo(address arg0) public view returns(WaterTowerStorage.UserInfo memory) {
        return WaterTowerStorage.layout().userInfo[arg0];
    }

    // generated getter for totalDeposits
    function totalDeposits() public view returns(uint256) {
        return WaterTowerStorage.layout().totalDeposits;
    }

    // generated getter for sharePerWater
    function sharePerWater() public view returns(uint256) {
        return WaterTowerStorage.layout().sharePerWater;
    }

}
