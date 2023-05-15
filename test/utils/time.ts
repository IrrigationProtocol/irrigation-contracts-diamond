import { time } from '@nomicfoundation/hardhat-network-helpers';

// set the timestamp of the next block but don't mine a new block
export async function skipTime(skipTime: number) {
    await time.setNextBlockTimestamp((await time.latest()) + skipTime);
}