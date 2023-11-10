import { ethers, network } from 'hardhat';
import { deployments } from '../deployments';
import { CONTRACT_ADDRESSES } from '../shared';
import { multicallRead } from '../multicall';

const rootAddress = deployments[network.name]?.DiamondAddress;
async function main() {
  const auctionContract = await ethers.getContractAt('AuctionUpgradeable', rootAddress);
  const multicallContract = await ethers.getContractAt(
    'IMulticall2',
    CONTRACT_ADDRESSES.MULTICALL2,
  );
  const callDataArray = [];
  const curAuctionId = await auctionContract.getAuctionsCount();
  for (let i = 0; i <= Number(curAuctionId); i++) {
    callDataArray.push({
      contract: auctionContract,
      functionName: 'getAuction',
      param: [`${i}`],
      returnKey: `${i}`,
    });
  }
  const multicallResult = await multicallRead(multicallContract, callDataArray);
  const auctionsWithFee = [];
  for (let i = 0; i <= Number(curAuctionId); i++) {
    if (Number(multicallResult[i][0].lockedLevel) > 0) auctionsWithFee.push(i);
  }
  console.log('auctions with fee', auctionsWithFee);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
