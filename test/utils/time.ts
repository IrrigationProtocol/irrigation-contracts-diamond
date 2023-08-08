import { ethers } from 'hardhat';

// set the timestamp of the next block but don't mine a new block
export async function skipTime(skipTime: number) {
    const curTimestamp = (await ethers.provider.getBlock('latest')).timestamp
    await ethers.provider.send('evm_setNextBlockTimestamp', [curTimestamp + skipTime]);
}