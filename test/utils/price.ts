import { BigNumber } from "ethers";
const BDV_FACTOR = BigNumber.from(10**12);

// function to get pods price offchain
/**
 * @notice Get price for any pods (decimals 18)
 * @param placeInLine with decimals 6
 * @param pods with decimals 6
 * @param podIndex with decimals 6
 * @param harvestableIndex with decimals 6
 * @return price pods price
 * @dev   pods price = (1 - (placeInLine + pods/2 - harvestableIndex)/(podIndex-harvestableIndex)) * pods
 */
export function getPriceOfPods(
    placeInLine: BigNumber,
    pods: BigNumber,
    podIndex: BigNumber,
    harvestableIndex: BigNumber
) {
    const unharvestable = podIndex.sub(harvestableIndex);
    let accumulatedPrice: BigNumber = BigNumber.from(0);
    if (unharvestable.eq(0) || placeInLine.add(pods).lte(harvestableIndex)) {
        return pods.mul(BDV_FACTOR);
    } else if (placeInLine.lte(harvestableIndex)) {
        accumulatedPrice = (harvestableIndex.sub(placeInLine)).mul(BDV_FACTOR);
        pods = pods.sub(harvestableIndex.sub(placeInLine));
        placeInLine = harvestableIndex;
    }
    let numerator = podIndex.sub(placeInLine).sub(pods.div(2));
    return accumulatedPrice.add((numerator.mul(pods).mul(BDV_FACTOR)).div(unharvestable));
}