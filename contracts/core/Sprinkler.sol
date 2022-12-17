// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IOracle.sol";
import "../beanstalk/IBeanstalk.sol";

contract Sprinkler is OwnableUpgradeable {
    using SafeERC20 for IERC20;

    event PriceOracleUpdated(address indexed token, address oracle);
    event WaterExchanged(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 waterAmount,
        bool isTemporarily
    );

    // Water token address
    address public waterToken;
    // Beanstalk protocol contract
    IBeanstalk public beanstalk;
    mapping(address => IOracle) public priceOracles;
    mapping(address => uint256) public tokenMultiplier;

    function initialize(address _waterToken, address _beanstalk)
        external
        initializer
    {
        __Ownable_init();

        waterToken = _waterToken;
        beanstalk = IBeanstalk(_beanstalk);
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
        priceOracles[_token] = IOracle(_oracle);
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
        tokenMultiplier[_token] = _multiplier;
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
        address _waterToken = waterToken;

        require(_token != _waterToken, "Invalid token");
        require(_amount != 0, "Invalid amount");

        uint256 tokenPrice = priceOracles[_token].latestPrice();
        uint256 waterPrice = priceOracles[_waterToken].latestPrice();

        waterAmount =
            (_amount * tokenPrice * tokenMultiplier[_token]) /
            waterPrice;
        require(waterAmount != 0, "No water output");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        IERC20(waterToken).safeTransfer(msg.sender, waterAmount);

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
        address _waterToken = waterToken;

        // plot input will be validated in the transferPlot function.
        beanstalk.transferPlot(
            msg.sender,
            address(this),
            _plotId,
            _plotStart,
            _plotEnd
        );

        uint256 amount = _plotEnd - _plotStart;
    }
}
