// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./WaterCommonStorage.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20MetadataUpgradeable.sol";
import "../interfaces/ICustomOracle.sol";
import {IBeanstalkUpgradeable} from "../beanstalk/IBeanstalkUpgradeable.sol";
import "./SprinklerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";
import "../libraries/Constants.sol";
import "../interfaces/ISprinklerUpgradeable.sol";
import "../interfaces/IPriceOracleUpgradeable.sol";

contract SprinklerUpgradeable is
    EIP2535Initializable,
    IrrigationAccessControl,
    ISprinklerUpgradeable
{
    using SprinklerStorage for SprinklerStorage.Layout;
    /// @dev errors
    error InsufficientWater();

    /// @dev admin setters
    /**
     * @notice Set token decimals to calculate correct water amount
     * @param _token underlying token address
     * @param _multiplier price oracle address
     */
    function setTokenMultiplier(address _token, uint256 _multiplier) external onlySuperAdminRole {
        SprinklerStorage.layout().whitelistAssets[_token].tokenMultiplier = _multiplier;
    }

    /**
     * @notice add asset to whitelist
     * @param _token underlying token address
     * @param _multiplier token multiplier, if this is 0, multiplier is calculated from decimals of token
     */
    function addAssetToWhiteList(address _token, uint256 _multiplier) external onlySuperAdminRole {
        require(
            SprinklerStorage.layout().whitelistAssets[_token].tokenMultiplier == 0,
            "already added asset"
        );

        uint256 _tokenMultiplier;
        if (_token == Constants.ETHER) _tokenMultiplier = 1;
        else
            _tokenMultiplier = _multiplier != 0
                ? _multiplier
                : 10 **
                    (IERC20MetadataUpgradeable(address(this)).decimals() -
                        IERC20MetadataUpgradeable(_token).decimals());
        WhitelistAsset memory newAsset = WhitelistAsset(_tokenMultiplier, true);
        SprinklerStorage.layout().whitelistAssets[_token] = newAsset;
        SprinklerStorage.layout().allWhiteList.push(_token);
        emit AddWhiteListAsset(_token, _tokenMultiplier);
    }

    /**
     * @notice pause exchanging
     */

    function unListAsset(address _token) external onlySuperAdminRole {
        SprinklerStorage.layout().whitelistAssets[_token].isListed = false;
        emit UnListAsset(_token);
    }

    /**
     * @notice Exchange whitelisted asset(BEAN, BEAN:3CRV, Spot, and so on) to water
     * @param _token source token address
     * @param _amount source token amount
     * @return waterAmount received water amount
     */
    function exchangeTokenToWater(
        address _token,
        uint256 _amount
    ) external onlyListedAsset(_token) returns (uint256 waterAmount) {
        require(_token != address(this), "Invalid token");
        require(_amount != 0, "Invalid amount");

        waterAmount = getWaterAmount(_token, _amount);
        if (waterAmount > sprinkleableWater()) revert InsufficientWater();
        require(waterAmount != 0, "No water output"); // if price is 0, amount can be 0

        TransferHelper.safeTransferFrom(_token, msg.sender, address(this), _amount);
        transferWater(waterAmount);

        emit WaterExchanged(msg.sender, _token, _amount, waterAmount, false);
    }

    /**
     * @notice Exchange ETH to water
     * @return waterAmount received water amount
     */
    function exchangeETHToWater() external payable returns (uint256 waterAmount) {
        require(msg.value != 0, "Invalid amount");
        waterAmount = getWaterAmount(Constants.ETHER, msg.value);
        if (waterAmount > sprinkleableWater()) revert InsufficientWater();
        require(waterAmount != 0, "No water output"); // if price is 0 or tokenMultiplier is 0, amount can be 0
        transferWater(waterAmount);
        emit WaterExchanged(msg.sender, Constants.ETHER, msg.value, waterAmount, false);
    }

    function transferWater(uint256 amount) internal {
        address _waterToken = address(this);
        TransferHelper.safeTransfer(_waterToken, msg.sender, amount);
        SprinklerStorage.layout().availableWater =
            SprinklerStorage.layout().availableWater -
            amount;
    }

    function depositWater(uint256 amount) public {
        require(amount != 0, "Invalid amount");
        SprinklerStorage.layout().availableWater =
            SprinklerStorage.layout().availableWater +
            amount;
        TransferHelper.safeTransferFrom(address(this), msg.sender, address(this), amount);
        emit DepositWater(amount);
    }

    /// getters
    ///
    /// @notice Get amount of water to exchange whitelisted asset(BEAN, ROOT, Spot, and so on)
    /// @param _token source token address
    /// @param _amount source token amount
    /// @return waterAmount received water amount
    ///
    function getWaterAmount(
        address _token,
        uint256 _amount
    ) public view returns (uint256 waterAmount) {
        uint256 multiplier = tokenMultiplier(_token);
        uint256 tokenPrice = IPriceOracleUpgradeable(address(this)).getPrice(_token);
        uint256 waterPrice = IPriceOracleUpgradeable(address(this)).getWaterPrice();
        waterAmount = (_amount * tokenPrice * multiplier) / waterPrice;
    }

    /// @notice get whitelisted token addresses
    function getWhitelist() external view returns (address[] memory) {
        return SprinklerStorage.layout().allWhiteList;
    }

    /// @notice get token multiplier
    function tokenMultiplier(address _token) public view returns (uint256) {
        return SprinklerStorage.layout().whitelistAssets[_token].tokenMultiplier;
    }

    /// @notice get water amount available for sprinkler
    function sprinkleableWater() public view returns (uint256) {
        return SprinklerStorage.layout().availableWater;
    }

    modifier onlyListedAsset(address _token) {
        require(SprinklerStorage.layout().whitelistAssets[_token].isListed, "not allowed token");
        _;
    }
}
