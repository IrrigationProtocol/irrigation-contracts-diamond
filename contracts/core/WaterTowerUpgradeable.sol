// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./WaterTowerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "../curve/ICurveSwapRouter.sol";
import "../curve/ICurveMetaPool.sol";
import "../libraries/Constants.sol";
import "../interfaces/ISprinklerUpgradeable.sol";
import "../interfaces/IPriceOracleUpgradeable.sol";

contract WaterTowerUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using WaterTowerStorage for WaterTowerStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error NotAutoIrrigate();
    error InsufficientBalance();
    error InsufficientReward();
    error InvalidRewardPool();
    /// @dev admin errors
    error InvalidTime();

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

    event AddETH(uint256 amount);
    event SetReward(uint256 amount);

    uint256 internal constant IRRIGATE_BONUS_DOMINATOR = 100;

    /// @notice deposit water token
    function deposit(uint256 amount, bool bAutoIrrigate) external {
        setAutoIrrigate(bAutoIrrigate);
        _deposit(msg.sender, amount);
        IERC20Upgradeable(address(this)).safeTransferFrom(msg.sender, address(this), amount);
    }

    // withdraw water token
    function withdraw(uint256 amount) external {
        _withdraw(msg.sender, amount);
        IERC20Upgradeable(address(this)).safeTransfer(msg.sender, amount);
    }

    /// @notice claim ETH rewards
    function claim(uint256 amount) external {
        uint256 claimAmount = _claimReward(msg.sender, amount);
        (bool success, ) = msg.sender.call{value: claimAmount}("");
        require(success, "Claim failed");
        emit Claimed(msg.sender, claimAmount);
    }

    function irrigate(uint256 amount) external {
        _irrigate(msg.sender, amount);
    }

    function autoIrrigate(address user) external onlySuperAdminRole {
        if (!WaterTowerStorage.layout().users[user].isAutoIrrigate) revert NotAutoIrrigate();
        _irrigate(user, 0);
    }

    function setAutoIrrigate(bool bAutoIrrigate) public {
        WaterTowerStorage.layout().users[msg.sender].isAutoIrrigate = bAutoIrrigate;
    }

    /// @dev internal
    /// @dev if user is not updated in current pool index, reward rate is calculated
    function _updateUserPool(
        address user,
        PoolInfo memory poolInfo,
        uint256 curPoolIndex
    ) internal {
        UserInfo storage _userInfo = WaterTowerStorage.userInfo(user);
        if (_userInfo.lastPoolIndex != curPoolIndex) {
            PoolInfo memory lastPoolInfo = WaterTowerStorage.layout().pools[
                _userInfo.lastPoolIndex
            ];
            if (_userInfo.rewardRate != 0 && lastPoolInfo.totalRewardRate != 0) {
                _userInfo.pending +=
                    (_userInfo.rewardRate * lastPoolInfo.monthlyRewards) /
                    lastPoolInfo.totalRewardRate;
            }
            uint256 userRewardRate = WaterTowerStorage.userInfo(user).amount *
                (poolInfo.endTime - block.timestamp);
            _userInfo.lastPoolIndex = curPoolIndex;
            /// @dev if user deposit in last month, reward rate is increased
            ///      and if there is no deposit for user, reward rate start from 0
            _userInfo.rewardRate = userRewardRate;
            WaterTowerStorage.layout().pools[curPoolIndex].totalRewardRate =
                poolInfo.totalRewardRate +
                userRewardRate;
        }
    }

    function _irrigate(address irrigator, uint256 irrigateAmount) internal {
        uint rewardAmount = _claimReward(irrigator, irrigateAmount);
        uint256 swappedWaterAmount = _swapEthForWater(rewardAmount);
        uint256 bonusAmount = (swappedWaterAmount * WaterTowerStorage.layout().irrigateBonusRate) /
            IRRIGATE_BONUS_DOMINATOR;
        _deposit(irrigator, swappedWaterAmount + bonusAmount);
        WaterTowerStorage.layout().totalBonus += bonusAmount;
        emit Irrigate(
            irrigator,
            WaterTowerStorage.layout().middleAssetForIrrigate,
            rewardAmount,
            swappedWaterAmount,
            bonusAmount
        );
    }

    /// @dev if amount is 0, claim max claimalble amount
    function _claimReward(address user, uint256 amount) internal returns (uint256) {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        _updateUserPool(user, WaterTowerStorage.layout().pools[curPoolIndex], curPoolIndex);

        uint256 ethReward = WaterTowerStorage.userInfo(user).pending;
        if (ethReward < amount) revert InsufficientReward();
        if (amount == 0) amount = ethReward;
        WaterTowerStorage.layout().users[user].pending = ethReward - amount;
        return amount;
    }

    function _deposit(address user, uint amount) internal {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[curPoolIndex];
        _updateUserPool(user, poolInfo, curPoolIndex);
        WaterTowerStorage.layout().users[user].amount += amount;
        uint256 rewardRate = amount * (poolInfo.endTime - block.timestamp);
        WaterTowerStorage.layout().users[user].rewardRate += rewardRate;
        WaterTowerStorage.layout().pools[curPoolIndex].totalRewardRate =
            poolInfo.totalRewardRate +
            rewardRate;
        WaterTowerStorage.layout().totalDeposits += amount;
        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[curPoolIndex];
        _updateUserPool(user, poolInfo, curPoolIndex);
        WaterTowerStorage.layout().users[user].amount -= amount;
        uint256 rewardRate = amount * (poolInfo.endTime - block.timestamp);
        WaterTowerStorage.layout().users[user].rewardRate -= rewardRate;
        WaterTowerStorage.layout().pools[curPoolIndex].totalRewardRate =
            poolInfo.totalRewardRate -
            rewardRate;
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
                Constants.ZERO,
                Constants.ZERO,
                Constants.ZERO,
                Constants.ZERO
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

    function getBonusForIrrigate(
        uint256 ethAmount
    ) public view returns (uint256 waterAmount, uint256 bonusAmount) {
        if (WaterTowerStorage.layout().middleAssetForIrrigate == Constants.BEAN) {
            /// @dev swap amount ETH->USDT->BEAN through Curve finance
            uint256 usdtAmount = ICurveMetaPool(Constants.TRI_CRYPTO_POOL).get_dy(
                uint256(2),
                0,
                ethAmount
            );
            uint beanAmount = ICurveMetaPool(Constants.CURVE_BEAN_METAPOOL).get_dy_underlying(
                3,
                0,
                usdtAmount
            );
            waterAmount = ISprinklerUpgradeable(address(this)).getWaterAmount(
                Constants.BEAN,
                beanAmount
            );
            bonusAmount =
                (waterAmount * WaterTowerStorage.layout().irrigateBonusRate) /
                IRRIGATE_BONUS_DOMINATOR;
        } else return (0, 0);
    }

    function addETHReward() public payable {
        if (msg.value > 0) {
            WaterTowerStorage.layout().totalRewards += msg.value;
        }
    }

    function updateMonthlyReward(uint256 monthlyRewards) internal onlySuperAdminRole {
        uint256 totalRewards = WaterTowerStorage.layout().totalRewards;
        if (monthlyRewards > totalRewards) revert InsufficientReward();
        totalRewards -= monthlyRewards;
        WaterTowerStorage.layout().totalRewards = totalRewards;
        WaterTowerStorage.curPool().monthlyRewards = monthlyRewards;
    }

    /// @dev admin setters
    function setMiddleAsset(address middleAsset) external onlySuperAdminRole {
        WaterTowerStorage.layout().middleAssetForIrrigate = middleAsset;
    }

    function setIrrigateBonusRate(uint256 bonusRate) external onlySuperAdminRole {
        WaterTowerStorage.layout().irrigateBonusRate = bonusRate;
    }

    function setPool(uint256 endTime, uint256 monthlyRewards) external payable onlySuperAdminRole {
        if ((endTime != 0 && endTime < block.timestamp)) revert InvalidTime();
        updateMonthlyReward(monthlyRewards);
        if (endTime == 0) endTime = block.timestamp + 30 days;
        uint256 poolIndex = WaterTowerStorage.layout().curPoolIndex;
        ++poolIndex;
        WaterTowerStorage.layout().pools[poolIndex].endTime = endTime;
        WaterTowerStorage.layout().curPoolIndex = poolIndex;
    }

    /// @dev getters for users
    function userInfo(address user) external view returns (UserInfo memory) {
        return WaterTowerStorage.userInfo(user);
    }

    /// @dev public getters
    /// @notice view function to see pending eth reward for each user
    function userETHReward(address user) public view returns (uint256 ethReward) {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        if (curPoolIndex == 1) return 0;
        UserInfo memory _userInfo = WaterTowerStorage.userInfo(user);
        PoolInfo memory lastPoolInfo = WaterTowerStorage.layout().pools[_userInfo.lastPoolIndex];
        ethReward = _userInfo.pending;
        if (_userInfo.lastPoolIndex != curPoolIndex) {
            if (_userInfo.rewardRate != 0 && lastPoolInfo.totalRewardRate != 0) {
                ethReward +=
                    (_userInfo.rewardRate * lastPoolInfo.monthlyRewards) /
                    lastPoolInfo.totalRewardRate;
            }
        }
    }

    function totalDeposits() public view returns (uint256) {
        return WaterTowerStorage.layout().totalDeposits;
    }

    function getPoolIndex() external view returns (uint256) {
        return WaterTowerStorage.layout().curPoolIndex;
    }

    function getPoolInfo(uint256 poolIndex) external view returns (PoolInfo memory) {
        return
            WaterTowerStorage.layout().pools[
                poolIndex == 0 ? WaterTowerStorage.layout().curPoolIndex : poolIndex
            ];
    }

    function getMiddleAsset() public view returns (address) {
        return WaterTowerStorage.layout().middleAssetForIrrigate;
    }
}
