import { ethers } from 'hardhat';

export async function getCurrentBlockTime() {
    return (await ethers.provider.getBlock('latest')).timestamp;
}

// set the timestamp of the next block but don't mine a new block
export async function skipTime(skipTime: number) {
    const curTimestamp = await getCurrentBlockTime();
    await ethers.provider.send('evm_setNextBlockTimestamp', [curTimestamp + skipTime]);
}