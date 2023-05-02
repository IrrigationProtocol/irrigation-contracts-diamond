// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../interfaces/ICustomOracle.sol";
import "./PriceOracleStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "./ChainlinkOracle.sol";
import "./AggregatorV2V3Interface.sol";

contract PriceOracleUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using PriceOracleStorage for PriceOracleStorage.Layout;

    /// @dev events
    event UpdateAssetPrice(address asset, uint256 oldPrice, uint256 price);
    // event UpdateChainlinkFeed(address asset, address feed);
    event UpdateOracle(address asset, address oracle, OracleType oType);

    /// @dev errors
    error RegisteredOracleAsset();
    error InvalidChainlinkFeed();
    error InvalidCustomOracleAddress();

    function getUnderlyingPriceETH() external view returns (uint) {
        return getChainlinkPrice(getChainlinkFeed(Constants.ETHER));
    }

    function getPrice(address asset) external view returns (uint256 price) {
        uint256 _price = PriceOracleStorage.layout().prices[asset];
        if (_price != 0) {
            price = _price;
        } else if (PriceOracleStorage.layout().oracleItems[asset].oType == OracleType.CHAINLINK) {
            price = getChainlinkPrice(getChainlinkFeed(asset));
        } else if (
            PriceOracleStorage.layout().oracleItems[asset].oType == OracleType.CUSTOM_ORACLE
        ) {
            price = PriceOracleStorage.layout().oracleItems[asset].customOracle.latestPrice();
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
        PriceOracleStorage.layout().oracleItems[asset].oType = OracleType.CHAINLINK;
        PriceOracleStorage.layout().oracleItems[asset].chainlinkFeed = AggregatorV2V3Interface(
            feed
        );
        emit UpdateOracle(asset, feed, OracleType.CHAINLINK);
    }

    function setCustomOracle(address asset, address customOracle) external onlySuperAdminRole {
        if (customOracle == address(0) || customOracle == address(this))
            revert InvalidCustomOracleAddress();
        // if (PriceOracleStorage.layout().chainlinkAssets[asset]) revert RegisteredOracleAsset();
        PriceOracleStorage.layout().oracleItems[asset].oType = OracleType.CUSTOM_ORACLE;
        PriceOracleStorage.layout().oracleItems[asset].customOracle = ICustomOracle(customOracle);
        emit UpdateOracle(asset, customOracle, OracleType.CUSTOM_ORACLE);
        // PriceOracleStorage.layout().chainlinkFeeds[asset] = AggregatorV2V3Interface(feed);
    }

    function getChainlinkFeed(address asset) public view returns (AggregatorV2V3Interface) {
        return PriceOracleStorage.layout().oracleItems[asset].chainlinkFeed;
    }

    function getOracleItem(address asset) public view returns (OracleItem memory) {
        return PriceOracleStorage.layout().oracleItems[asset];
    }
}
