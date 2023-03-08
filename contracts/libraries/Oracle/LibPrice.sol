// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

library LibPrice {
    // decimals of price
    uint256 private constant DECIMALS = 18;

    // getter for prie
    /**
     * @notice Get price for any pods (decimals 18)
     * @param placeInLine with decimals 6
     * @param pods with decimals 6
     * @return price pods price
     */
    function getPriceOfPods(
        uint256 placeInLine,
        uint256 pods,
        uint256 podIndex,
        uint256 harvestableIndex
    ) internal pure returns (uint256) {
        uint256 unharvestable = podIndex - harvestableIndex;
        if (unharvestable == 0) {
            return 10**DECIMALS;
        }
        uint256 fraction = 1e36 / unharvestable;
        uint256 estimateId = placeInLine * 1e6 + harvestableIndex;
        uint256 medianPod = estimateId + (pods - 1e6) / 2;
        return (1e36 - (fraction * (medianPod - harvestableIndex))) / (10**(36 - DECIMALS));
    }
}
