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
    function claim(uint256 amount, uint256 poolIndex) external {
        uint256 claimAmount = _claimReward(msg.sender, amount, poolIndex);
        (bool success, ) = msg.sender.call{value: claimAmount}("");
        require(success, "Claim failed");
        emit Claimed(msg.sender, claimAmount);
    }

    function irrigate(uint256 amount, uint256 poolIndex) external {
        _irrigate(msg.sender, amount, poolIndex);
    }

    function autoIrrigate(address user, uint256 poolIndex) external onlySuperAdminRole {
        if (!WaterTowerStorage.layout().userSettings[user].isAutoIrrigate) revert NotAutoIrrigate();
        _irrigate(user, 0, poolIndex);
    }

    function setAutoIrrigate(bool bAutoIrrigate) public {
        WaterTowerStorage.layout().userSettings[msg.sender].isAutoIrrigate = bAutoIrrigate;
    }

    /// @dev internal
    /// @dev if there is no reward rate for user with amount in current pool, reward rate is calculated
    function _updateUserPool(address user, PoolInfo memory poolInfo) internal {
        UserPoolInfo memory curUserInfo = WaterTowerStorage.curUserPoolInfo(user);
        if (
            curUserInfo.rewardRate == 0 && WaterTowerStorage.layout().userSettings[user].amount != 0
        ) {
            uint256 userRewardRate = WaterTowerStorage.layout().userSettings[user].amount *
                (poolInfo.endTime - block.timestamp);
            WaterTowerStorage.curUserPoolInfo(user).rewardRate = userRewardRate;
            WaterTowerStorage.curPool().totalRewardRate = poolInfo.totalRewardRate + userRewardRate;
        }
    }

    function _irrigate(address irrigator, uint256 irrigateAmount, uint256 poolIndex) internal {
        uint rewardAmount = _claimReward(irrigator, irrigateAmount, poolIndex);
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

    /// @dev if amount is 0, means max claim amount
    function _claimReward(
        address user,
        uint256 amount,
        uint256 poolIndex
    ) internal returns (uint256) {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        /// @dev Users can always claim monthly rewards for months prior to this month
        if (poolIndex >= curPoolIndex) revert InvalidRewardPool();
        _updateUserPool(user, WaterTowerStorage.layout().pools[curPoolIndex]);
        if (poolIndex == 0) poolIndex = curPoolIndex - 1;
        // calculate user reward
        UserPoolInfo memory _userInfo = WaterTowerStorage.layout().users[poolIndex][user];
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[poolIndex];
        uint256 ethReward = (poolInfo.monthlyRewards * _userInfo.rewardRate) /
            poolInfo.totalRewardRate -
            _userInfo.claimed;
        // uint256 reward = userETHReward(user, poolIndex);
        if (ethReward < amount) revert InsufficientReward();
        if (amount == 0) amount = ethReward;
        WaterTowerStorage.layout().users[poolIndex][user].claimed += amount;
        return amount;
    }

    function _deposit(address user, uint amount) internal {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        UserPoolInfo storage curUserInfo = WaterTowerStorage.curUserPoolInfo(user);
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[curPoolIndex];
        _updateUserPool(user, poolInfo);
        WaterTowerStorage.layout().userSettings[user].amount += amount;
        uint256 rewardRate = amount * (poolInfo.endTime - block.timestamp);
        curUserInfo.rewardRate += rewardRate;

        WaterTowerStorage.layout().totalDeposits += amount;
        WaterTowerStorage.layout().pools[curPoolIndex].totalRewardRate =
            poolInfo.totalRewardRate +
            rewardRate;
        WaterTowerStorage.userInfo(user).lastPoolIndex = curPoolIndex;
        emit Deposited(user, amount);
    }

    function _withdraw(address user, uint amount) internal {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        UserPoolInfo storage curUserInfo = WaterTowerStorage.curUserPoolInfo(user);
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[curPoolIndex];

        _updateUserPool(user, poolInfo);
        WaterTowerStorage.layout().userSettings[user].amount -= amount;
        uint256 rewardRate = amount * (poolInfo.endTime - block.timestamp);
        curUserInfo.rewardRate -= rewardRate;

        WaterTowerStorage.layout().totalDeposits -= amount;
        WaterTowerStorage.layout().pools[curPoolIndex].totalRewardRate =
            poolInfo.totalRewardRate -
            rewardRate;
        WaterTowerStorage.userInfo(user).lastPoolIndex = curPoolIndex;
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
        /// @dev total deposits of current pool is
        WaterTowerStorage.layout().pools[poolIndex] = PoolInfo({
            totalRewardRate: 0,
            endTime: endTime,
            monthlyRewards: 0
        });
        WaterTowerStorage.layout().curPoolIndex = poolIndex;
    }

    /// @dev getters for users
    function userInfo(address user) external view returns (UserInfo memory) {
        return WaterTowerStorage.layout().userSettings[user];
    }

    function userPoolInfo(
        uint256 poolIndex,
        address user
    ) external view returns (UserPoolInfo memory) {
        return WaterTowerStorage.layout().users[poolIndex][user];
    }

    /// @dev public getters
    /// @notice view function to see pending eth reward for each user
    function userETHReward(
        address user,
        uint256 poolIndex
    ) public view returns (uint256 ethReward) {
        uint256 curPoolIndex = WaterTowerStorage.layout().curPoolIndex;
        if (curPoolIndex == 0 || poolIndex >= curPoolIndex) return 0;
        if (poolIndex == 0) poolIndex = curPoolIndex - 1;
        UserPoolInfo memory _userInfo = WaterTowerStorage.layout().users[poolIndex][user];
        PoolInfo memory poolInfo = WaterTowerStorage.layout().pools[poolIndex];
        ethReward =
            (poolInfo.monthlyRewards * _userInfo.rewardRate) /
            poolInfo.totalRewardRate -
            _userInfo.claimed;
    }

    function totalDeposits() public view returns (uint256) {
        return WaterTowerStorage.layout().totalDeposits;
    }

    function getPoolIndex() external view returns (uint256) {
        return WaterTowerStorage.layout().curPoolIndex;
    }

    function getPoolInfo(uint256 poolIndex) external view returns (PoolInfo memory) {
        return WaterTowerStorage.layout().pools[poolIndex];
    }

    function getMiddleAsset() public view returns (address) {
        return WaterTowerStorage.layout().middleAssetForIrrigate;
    }
}
