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
     * @param podIndex with decimals 6
     * @param harvestableIndex with decimals 6
     * @return price pods price
     * @dev   pods price = (1 - (placeInLine + pods/2 - harvestableIndex)/(podIndex-harvestableIndex)) * pods
     */
    function getPriceOfPods(
        uint256 placeInLine,
        uint256 pods,
        uint256 podIndex,
        uint256 harvestableIndex
    ) internal pure returns (uint256) {
        uint256 unharvestable = podIndex - harvestableIndex;
        if (unharvestable == 0 || placeInLine <= harvestableIndex) {
            return 10 ** DECIMALS;
        }
        uint256 numerator = podIndex - placeInLine - pods / 2;
        return ((numerator * pods) * 10 ** (DECIMALS - 6)) / unharvestable;
    }
}
