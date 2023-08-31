/**
 * @title After we deploy contracts, initialize contracts by making whitelist on sprinkler, auctions, farmer's market
 *        And, on develop chain, we will deploy mock tokens for testing
 *        Initialization is required one time only
 */
import { debug } from 'debug';
import hre, { ethers, network } from 'hardhat';
import { toWei } from './common';
import { deployments } from './deployments';
import { initAll } from './init';
import { mintAllTokensForTesting } from '../test/utils/mint';

const log: debug.Debugger = debug('IrrigationInit:log');
log.color = '159';

const networkName = hre.network.name;

async function main() {
  if (require.main === module) {
    debug.enable('Irrigation.*:log');
  }
  log(`initialize contracts on ${networkName}`);  
  const contractAddress = deployments[networkName]?.DiamondAddress;
  const [deployer] = await ethers.getSigners();
  if(network.name !== 'mainnet') await mintAllTokensForTesting(deployer.address);
  log(`minting is done`);
  await initAll(contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
