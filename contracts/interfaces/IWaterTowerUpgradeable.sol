// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title WaterTower Interface

interface IWaterTowerUpgradeable {
    
    /// @dev events
    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Claimed(address indexed user, uint amount);
    event Irrigate(
        address indexed user,
        address middleAsset,
        uint irrigateAmount,
        uint waterAmount,
        uint bonusAmount
    );
    event SetAutoIrrigate(address indexed user, uint timestamp, bool status);

    event AddETH(uint256 amount);
    event SetReward(uint256 amount);

    function addETHReward() external payable;
}
