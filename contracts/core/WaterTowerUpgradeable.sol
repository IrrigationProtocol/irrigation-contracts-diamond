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

    struct UserInfo {
        uint256 amount;
        uint256 debt;
        uint256 pending;
    }

    uint256 constant DECIMALS = 1e18;

    function WaterTower_initialize(address _waterToken) public initializer onlySuperAdminRole {
        __WaterTower_init(_waterToken);
    }

    function __WaterTower_init(address _waterToken) internal onlyInitializing {
        WaterTowerStorage.layout().waterToken = IERC20Upgradeable(_waterToken);
    }

    function deposit(uint amount) external {
        WaterTowerStorage.layout().waterToken.safeTransferFrom(msg.sender, address(this), amount);

        _deposit(msg.sender, amount);
    }

    function withdraw(uint amount) external {
        WaterTowerStorage.layout().waterToken.safeTransfer(msg.sender, amount);

        _withdraw(msg.sender, amount);
    }

    function claim(uint amount) external {
        UserInfo storage userInfo = WaterTowerStorage.layout().userInfos[msg.sender];
        userInfo.pending += WaterTowerStorage.layout().sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.debt = WaterTowerStorage.layout().sharePerWater * userInfo.amount;

        if (amount == type(uint).max) {
            amount = userInfo.pending / DECIMALS;
        }
        userInfo.pending -= amount * DECIMALS;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Claim failed");

        emit Claimed(msg.sender, amount);
    }

    function compound(uint amount) external {}

    receive() external payable {
        require(WaterTowerStorage.layout().totalDeposits != 0, "no deposits");

        WaterTowerStorage.layout().sharePerWater += (msg.value * DECIMALS) / WaterTowerStorage.layout().totalDeposits;
    }

    function _deposit(address user, uint amount) internal {
        UserInfo storage userInfo = WaterTowerStorage.layout().userInfos[user];
        userInfo.pending += WaterTowerStorage.layout().sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.amount += amount;
        userInfo.debt = WaterTowerStorage.layout().sharePerWater * userInfo.amount;

        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        UserInfo storage userInfo = WaterTowerStorage.layout().userInfos[user];
        userInfo.pending += WaterTowerStorage.layout().sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.amount -= amount;
        userInfo.debt = WaterTowerStorage.layout().sharePerWater * userInfo.amount;

        emit Withdrawn(user, amount);
    }
    // generated getter for ${varDecl.name}
    function waterToken() public view returns(IERC20Upgradeable) {
        return WaterTowerStorage.layout().waterToken;
    }

    // generated getter for ${varDecl.name}
    function userInfos(address arg0) public view returns(UserInfo memory) {
        return WaterTowerStorage.layout().userInfos[arg0];
    }

    // generated getter for ${varDecl.name}
    function totalDeposits() public view returns(uint256) {
        return WaterTowerStorage.layout().totalDeposits;
    }

    // generated getter for ${varDecl.name}
    function sharePerWater() public view returns(uint256) {
        return WaterTowerStorage.layout().sharePerWater;
    }

}
