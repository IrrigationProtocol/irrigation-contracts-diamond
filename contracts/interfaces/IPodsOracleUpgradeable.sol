// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IPodsOracleUpgradeable {
    /// get price of pods at latest podIndex
    function latestPriceOfPods(uint256 placeInLine, uint256 pods) external returns (uint256);

    /// getter for price of pods at any podIndex
    /**
     * @notice Get price for any pods to 1e18
     * @param placeInLine with 1e6 decimals
     * @param pods with 1e6 decimals
     * @return price pods price
     */
    function priceOfPods(
        uint256 placeInLine,
        uint256 pods,
        uint256 podIndex,
        uint256 harvestableIndex
    ) external returns (uint256);
}
