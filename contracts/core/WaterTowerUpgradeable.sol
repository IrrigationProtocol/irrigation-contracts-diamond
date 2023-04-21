// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {WaterTowerStorage} from "./WaterTowerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "../curve/ICurveSwapRouter.sol";
import "../libraries/Constants.sol";
import "../interfaces/ISprinklerUpgradeable.sol";

contract WaterTowerUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using WaterTowerStorage for WaterTowerStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error NotAutoIrrigate();
    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Claimed(address indexed user, uint amount);

    /// @notice decimals of water token
    uint256 private constant DECIMALS = 1e18;

    /// @notice deposit water token
    function deposit(uint256 amount, bool bAutoIrrigate) external {
        setAutoIrrigate(bAutoIrrigate);
        IERC20Upgradeable(address(this)).safeTransferFrom(msg.sender, address(this), amount);
        _deposit(msg.sender, amount);
    }

    // withdraw water token
    function withdraw(uint256 amount) external {
        IERC20Upgradeable(address(this)).safeTransfer(msg.sender, amount);
        _withdraw(msg.sender, amount);
    }

    function claim(uint256 amount) external {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[
            msg.sender
        ];
        curUserInfo.pending +=
            WaterTowerStorage.layout().sharePerWater *
            curUserInfo.amount -
            curUserInfo.debt;

        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;

        if (amount == type(uint).max) {
            amount = curUserInfo.pending / DECIMALS;
        }
        curUserInfo.pending -= amount * DECIMALS;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Claim failed");

        emit Claimed(msg.sender, amount);
    }

    function irrigate() external {
        _irrigate(msg.sender);
    }

    function autoIrrigate(address user) external onlySuperAdminRole {
        if (!WaterTowerStorage.layout().userInfo[msg.sender].isAutoIrrigate)
            revert NotAutoIrrigate();
        _irrigate(user);
    }

    /// can't call app storage in this function
    receive() external payable {}

    /// admin setters
    function setAutoIrrigate(bool bAutoIrrigate) public {
        WaterTowerStorage.layout().userInfo[msg.sender].isAutoIrrigate = bAutoIrrigate;
    }

    /// internal
    function _irrigate(address irrigator) internal {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[
            irrigator
        ];
        uint256 amount = curUserInfo.pending / DECIMALS;
        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;
        curUserInfo.pending = 0;
        uint256 swappedWaterAmount = _swapEthForWater(amount);
        _deposit(irrigator, swappedWaterAmount);
    }

    function _deposit(address user, uint amount) internal {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[user];
        curUserInfo.pending +=
            WaterTowerStorage.layout().sharePerWater *
            curUserInfo.amount -
            curUserInfo.debt;

        curUserInfo.amount += amount;
        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;
        WaterTowerStorage.layout().totalDeposits += amount;
        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        WaterTowerStorage.UserInfo storage curUserInfo = WaterTowerStorage.layout().userInfo[user];
        curUserInfo.pending +=
            WaterTowerStorage.layout().sharePerWater *
            curUserInfo.amount -
            curUserInfo.debt;

        curUserInfo.amount -= amount;
        curUserInfo.debt = WaterTowerStorage.layout().sharePerWater * curUserInfo.amount;
        WaterTowerStorage.layout().totalDeposits -= amount;
        emit Withdrawn(user, amount);
    }

    function _swapEthForWater(uint256 amount) internal returns (uint256 waterAmount) {
        if (WaterTowerStorage.layout().middleAssetForIrrigate == Constants.BEAN) {
            /// @dev swap ETH for BEAN using curve router
            address[9] memory route = [
                Constants.ETHER,
                Constants.TRI_CRYPTO_POOL,
                Constants.USDT,
                Constants.CURVE_BEAN_METAPOOL,
                Constants.BEAN,
                0x0000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000
            ];
            uint256[3][4] memory swapParams = [
                [uint(2), 0, 3],
                [uint(3), 0, 2],
                [uint(0), 0, 0],
                [uint(0), 0, 0]
            ];
            uint256 beanAmount = ICurveSwapRouter(Constants.CURVE_ROUTER).exchange_multiple{
                value: amount
            }(route, swapParams, amount, 0);

            waterAmount = ISprinklerUpgradeable(address(this)).getWaterAmount(
                Constants.BEAN,
                beanAmount
            );
        }
    }

    // generated getter for usersInfos
    function userInfo(address arg0) public view returns (WaterTowerStorage.UserInfo memory) {
        return WaterTowerStorage.layout().userInfo[arg0];
    }

    // generated getter for totalDeposits
    function totalDeposits() public view returns (uint256) {
        return WaterTowerStorage.layout().totalDeposits;
    }

    // generated getter for sharePerWater
    function sharePerWater() public view returns (uint256) {
        return WaterTowerStorage.layout().sharePerWater;
    }
}
