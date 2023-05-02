// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./WaterCommonStorage.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/interfaces/IERC20MetadataUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/ICustomOracle.sol";
import "../beanstalk/IBeanstalkUpgradeable.sol";
import "./SprinklerStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "../libraries/TransferHelper.sol";

contract SprinklerUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using SprinklerStorage for SprinklerStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event PriceOracleUpdated(address indexed token, address oracle);
    event WaterExchanged(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 waterAmount,
        bool isTemporarily
    );
    event AddWhiteListAsset(address indexed token, address priceOracle, uint256 tokenMultiplier);
    event UnListAsset(address indexed token);

    /**
     * @notice Set price oracle
     * @notice To remove existing oracle, just use zero address as _oracle
     * @param _token underlying whitelisted token address
     * @param _oracle price oracle address
     */
    function setPriceOracle(
        address _token,
        address _oracle
    ) external onlySuperAdminRole onlyListedAsset(_token) {
        SprinklerStorage.layout().whitelistAssets[_token].priceOracle = ICustomOracle(_oracle);
        emit PriceOracleUpdated(_token, _oracle);
    }

    function setWaterPriceOracle(address _oracle) external onlySuperAdminRole {
        SprinklerStorage.layout().waterPriceOracle = ICustomOracle(_oracle);
        emit PriceOracleUpdated(address(this), _oracle);
    }

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
     * @param _oracle price oracle address
     * @param _multiplier token multiplier, if this is 0, multiplier is calculated from decimals of token
     */
    function addAssetToWhiteList(
        address _token,
        address _oracle,
        uint256 _multiplier
    ) external onlySuperAdminRole {
        require(
            SprinklerStorage.layout().whitelistAssets[_token].tokenMultiplier == 0,
            "already added asset"
        );

        uint256 _tokenMultiplier = _multiplier != 0
            ? _multiplier
            : 10 **
                (IERC20MetadataUpgradeable(address(this)).decimals() -
                    IERC20MetadataUpgradeable(_token).decimals());
        WhitelistAsset memory newAsset = WhitelistAsset(
            ICustomOracle(_oracle),
            true,
            _tokenMultiplier
        );
        SprinklerStorage.layout().whitelistAssets[_token] = newAsset;
        SprinklerStorage.layout().allWhiteList.push(_token);
        emit AddWhiteListAsset(_token, _oracle, _tokenMultiplier);
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
        address _waterToken = address(this);
        require(_token != _waterToken, "Invalid token");
        require(_amount != 0, "Invalid amount");

        waterAmount = getWaterAmount(_token, _amount);
        require(waterAmount != 0, "No water output"); // if price is 0, amount can be 0

        TransferHelper.safeTransferFrom(_token, msg.sender, address(this), _amount);
        TransferHelper.safeTransfer(_waterToken, msg.sender, waterAmount);

        emit WaterExchanged(msg.sender, _token, _amount, waterAmount, false);
    }

    /// getters
    ///
    /// @notice Get amount of water to exchange whitelisted asset(BEAN, BEAN:3CRV, Spot, and so on)
    /// @param _token source token address
    /// @param _amount source token amount
    /// @return waterAmount received water amount
    ///
    function getWaterAmount(
        address _token,
        uint256 _amount
    ) public view returns (uint256 waterAmount) {
        uint256 multiplier = tokenMultiplier(_token);
        uint256 tokenPrice = priceOracle(_token).latestPrice();
        uint256 waterPrice = SprinklerStorage.layout().waterPriceOracle.latestPrice();
        waterAmount = (_amount * tokenPrice * multiplier) / waterPrice;
    }

    /// @notice get whitelisted token addresses
    function getWhitelist() external view returns (address[] memory) {
        return SprinklerStorage.layout().allWhiteList;
    }

    /// @notice get price oracle address
    function priceOracle(address _token) public view returns (ICustomOracle) {
        return SprinklerStorage.layout().whitelistAssets[_token].priceOracle;
    }

    /// @notice get token multiplier
    function tokenMultiplier(address _token) public view returns (uint256) {
        return SprinklerStorage.layout().whitelistAssets[_token].tokenMultiplier;
    }

    modifier onlyListedAsset(address _token) {
        require(SprinklerStorage.layout().whitelistAssets[_token].isListed, "not allowed token");
        _;
    }
}
