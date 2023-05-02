// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./AggregatorV2V3Interface.sol";
import "../libraries/Constants.sol";

contract ChainlinkOracle {
    address public admin;

    mapping(address => uint256) internal prices;
    mapping(address => AggregatorV2V3Interface) internal feeds;

    event PricePosted(
        address asset,
        uint256 previousPriceMantissa,
        uint256 requestedPriceMantissa,
        uint256 newPriceMantissa
    );
    event NewAdmin(address oldAdmin, address newAdmin);
    event FeedSet(address feed, address asset);

    constructor() {
        admin = msg.sender;
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

    function setDirectPrice(address asset, uint256 price) external onlyAdmin {
        emit PricePosted(asset, prices[asset], price, price);
        prices[asset] = price;
    }

    function setFeed(address asset, address feed) external onlyAdmin {
        require(feed != address(0) && feed != address(this), "invalid feed address");
        emit FeedSet(feed, asset);
        feeds[asset] = AggregatorV2V3Interface(feed);
    }

    function getFeed(address asset) public view returns (AggregatorV2V3Interface) {
        return feeds[asset];
    }

    function assetPrices(address asset) external view returns (uint256) {
        return prices[asset];
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        address oldAdmin = admin;
        admin = newAdmin;

        emit NewAdmin(oldAdmin, newAdmin);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin may call");
        _;
    }
}
