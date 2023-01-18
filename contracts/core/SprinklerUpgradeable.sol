// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/access/OwnableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IOracleUpgradeable.sol";
import "../beanstalk/IBeanstalkUpgradeable.sol";
import { SprinklerStorage } from "./SprinklerStorage.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/proxy/utils/Initializable.sol";

contract SprinklerUpgradeable is Initializable, OwnableUpgradeable {
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

    function __Sprinkler_init(address _waterToken, address _beanstalk) internal onlyInitializing {
        __Ownable_init_unchained();
        __Sprinkler_init_unchained(_waterToken, _beanstalk);
    }

    function __Sprinkler_init_unchained(address _waterToken, address _beanstalk) internal onlyInitializing {
        SprinklerStorage.layout().waterToken = _waterToken;
        SprinklerStorage.layout().beanstalk = IBeanstalkUpgradeable(_beanstalk);
    }

    /**
     * @notice Set price oracle
     * @notice To remove existing oracle, just use zero address as _oracle
     * @param _token underlying token address
     * @param _oracle price oracle address
     */
    function setPriceOracle(address _token, address _oracle)
        external
        onlyOwner
    {
        SprinklerStorage.layout().priceOracles[_token] = IOracleUpgradeable(_oracle);
        emit PriceOracleUpdated(_token, _oracle);
    }

    /**
     * @notice Set token decimals to calculate correct water amount
     * @param _token underlying token address
     * @param _multiplier price oracle address
     */
    function setTokenMultiplier(address _token, uint256 _multiplier)
        external
        onlyOwner
    {
        SprinklerStorage.layout().tokenMultiplier[_token] = _multiplier;
    }

    /**
     * @notice Exchange BEAN or BEAN:3CRV to water
     * @param _token source token address (BEAN or BEAN:3CRV)
     * @param _amount source token amount
     * @return waterAmount received water amount
     */
    function exchangeTokenToWater(address _token, uint256 _amount)
        external
        returns (uint256 waterAmount)
    {
        address _waterToken = SprinklerStorage.layout().waterToken;

        require(_token != _waterToken, "Invalid token");
        require(_amount != 0, "Invalid amount");

        uint256 tokenPrice = SprinklerStorage.layout().priceOracles[_token].latestPrice();
        uint256 waterPrice = SprinklerStorage.layout().priceOracles[_waterToken].latestPrice();

        waterAmount =
            (_amount * tokenPrice * SprinklerStorage.layout().tokenMultiplier[_token]) /
            waterPrice;
        require(waterAmount != 0, "No water output");

        IERC20Upgradeable(_token).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20Upgradeable(SprinklerStorage.layout().waterToken).safeTransfer(msg.sender, waterAmount);

        emit WaterExchanged(msg.sender, _token, _amount, waterAmount, false);
    }

    /**
     * @notice Exchange Pods to water
     * @return waterAmount received water amount
     */
    function exchangePodsToWater(
        uint256 _plotId,
        uint256 _plotStart,
        uint256 _plotEnd
    ) external returns (uint256 waterAmount) {
        address _waterToken = SprinklerStorage.layout().waterToken;

        // plot input will be validated in the transferPlot function.
        SprinklerStorage.layout().beanstalk.transferPlot(
            msg.sender,
            address(this),
            _plotId,
            _plotStart,
            _plotEnd
        );

        uint256 amount = _plotEnd - _plotStart;
    }
    // generated getter for ${varDecl.name}
    function waterToken() public view returns(address) {
        return SprinklerStorage.layout().waterToken;
    }

    // generated getter for ${varDecl.name}
    function beanstalk() public view returns(IBeanstalkUpgradeable) {
        return SprinklerStorage.layout().beanstalk;
    }

    // generated getter for ${varDecl.name}
    function priceOracles(address arg0) public view returns(IOracleUpgradeable) {
        return SprinklerStorage.layout().priceOracles[arg0];
    }

    // generated getter for ${varDecl.name}
    function tokenMultiplier(address arg0) public view returns(uint256) {
        return SprinklerStorage.layout().tokenMultiplier[arg0];
    }

}
