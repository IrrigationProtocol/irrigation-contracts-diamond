// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract WaterTower is Ownable {
    using SafeERC20 for IERC20;

    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Claimed(address indexed user, uint amount);

    struct UserInfo {
        uint256 amount;
        uint256 debt;
        uint256 pending;
    }

    uint256 constant DECIMALS = 1e18;

    // Water token address
    IERC20 public waterToken;

    mapping(address => UserInfo) public userInfos;

    uint256 public totalDeposits;

    uint256 public sharePerWater;

    constructor(address _waterToken) Ownable() {

        waterToken = IERC20(_waterToken);
    }

    function deposit(uint amount) external {
        waterToken.safeTransferFrom(msg.sender, address(this), amount);

        _deposit(msg.sender, amount);
    }

    function withdraw(uint amount) external {
        waterToken.safeTransfer(msg.sender, amount);

        _withdraw(msg.sender, amount);
    }

    function claim(uint amount) external {
        UserInfo storage userInfo = userInfos[msg.sender];
        userInfo.pending += sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.debt = sharePerWater * userInfo.amount;

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
        require(totalDeposits != 0, "no deposits");

        sharePerWater += (msg.value * DECIMALS) / totalDeposits;
    }

    function _deposit(address user, uint amount) internal {
        UserInfo storage userInfo = userInfos[user];
        userInfo.pending += sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.amount += amount;
        userInfo.debt = sharePerWater * userInfo.amount;

        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        UserInfo storage userInfo = userInfos[user];
        userInfo.pending += sharePerWater * userInfo.amount - userInfo.debt;

        userInfo.amount -= amount;
        userInfo.debt = sharePerWater * userInfo.amount;

        emit Withdrawn(user, amount);
    }
}
