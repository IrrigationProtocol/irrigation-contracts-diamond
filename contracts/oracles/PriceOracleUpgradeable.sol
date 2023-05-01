// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../interfaces/IPriceOracle.sol";
import "./PriceOracleStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "./ChainlinkOracle.sol";
import "./AggregatorV2V3Interface.sol";

contract PriceOracleUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using PriceOracleStorage for PriceOracleStorage.Layout;

    /// @dev events
    event UpdateAssetPrice(address asset, uint256 oldPrice, uint256 price);
    event UpdateChainlinkFeed(address asset, address feed);

    /// @dev errors
    error RegisteredOracleAsset();
    error InvalidChainlinkFeed();

    function getUnderlyingPriceETH() external view returns (uint) {
        return getChainlinkPrice(getChainlinkFeed(Constants.ETHER));
    }

    function getPrice(address asset) external view returns (uint256 price) {
        uint256 _price = PriceOracleStorage.layout().prices[asset];
        if (_price != 0) {
            price = _price;
        } else if (PriceOracleStorage.layout().chainlinkAssets[asset]) {
            price = getChainlinkPrice(getChainlinkFeed(asset));
        } else {
            price = getCurvePrice(asset);
        }
    }

    function getCurvePrice(address asset) public view returns (uint256) {
        return 0;
    }

    /// @dev returns price with decimals 18
    function getChainlinkPrice(AggregatorV2V3Interface feed) internal view returns (uint256) {
        // Chainlink USD-denominated feeds store answers at 8 decimals
        uint256 decimalDelta = uint256(18) - feed.decimals();
        // Ensure that we don't multiply the result by 0
        if (decimalDelta > 0) {
            return uint256(feed.latestAnswer()) * 10 ** decimalDelta;
        } else {
            return uint256(feed.latestAnswer());
        }
    }

    /// @dev admin setters
    /// @dev direct price
    function setDirectPrice(address asset, uint256 price) external onlySuperAdminRole {
        emit UpdateAssetPrice(asset, PriceOracleStorage.layout().prices[asset], price);
        PriceOracleStorage.layout().prices[asset] = price;
    }

    /// @dev chainlink oracle
    // function registerChainlinkAsset(address asset, address feed) external onlySuperAdminRole {
    //     if (PriceOracleStorage.layout().chainlinkAssets[asset]) revert RegisteredAsset();
    //     PriceOracleStorage.layout().chainlinkAssets[asset] = true;
    //     PriceOracleStorage.layout().chainlink.setFeed(asset, feed);
    // }

    function setChainlinkFeed(address asset, address feed) external onlySuperAdminRole {
        if (feed == address(0) || feed == address(this)) revert InvalidChainlinkFeed();
        if (PriceOracleStorage.layout().chainlinkAssets[asset]) revert RegisteredOracleAsset();
        PriceOracleStorage.layout().chainlinkAssets[asset] = true;
        emit UpdateChainlinkFeed(feed, asset);
        PriceOracleStorage.layout().chainlinkFeeds[asset] = AggregatorV2V3Interface(feed);
    }

    function getChainlinkFeed(address asset) public view returns (AggregatorV2V3Interface) {
        return PriceOracleStorage.layout().chainlinkFeeds[asset];
    }
}
