/**
 * @title After we deploy contracts, initialize contracts by making whitelist on sprinkler, auctions, farmer's market
 *        And, on develop chain, we will deploy mock tokens for testing
 *        Initialization is required one time only
 */
import { debug } from 'debug';
import hre, { ethers } from 'hardhat';
import { toWei } from './common';
import { deployments } from './deployments';
import { initAuction, initPriceOracles, initSprinkler, initWaterTower } from './init';
import { mintAllTokensForTesting } from '../test/utils/mint';

const log: debug.Debugger = debug('IrrigationInit:log');
log.color = '159';

const networkName = hre.network.name;

async function deployMockToken(mockDeployer, name, symbol) {
  const factoryContract = await ethers.getContractAt(
    'CREATE3Factory',
    deployments[networkName].FactoryAddress,
  );
  const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`Irrigation:${name}`));
  await factoryContract
    .connect(mockDeployer)
    .deploy(salt, mockTokenContract.bytecode, [], { value: 0 });
  const tokenAddress = await factoryContract.getDeployed(mockDeployer.address, salt);
  const token = await ethers.getContractAt('MockERC20Upgradeable', tokenAddress);
  await token.connect(mockDeployer).Token_Initialize(name, symbol, toWei(100_000_000));
  return token.address;
}

async function main() {
  if (require.main === module) {
    debug.enable('Irrigation.*:log');
  }
  log(`initialize contracts on ${networkName}`);
  const waterCommonContract = await ethers.getContractAt(
    'WaterCommonUpgradeable',
    deployments[networkName]?.DiamondAddress,
  );
  try {
    const beanstalk = await waterCommonContract.beanstalk();
    log(`beanstalk: `, beanstalk);
  } catch {}
  const contractAddress = deployments[networkName]?.DiamondAddress;
  const waterTower = await ethers.getContractAt('WaterTowerUpgradeable', contractAddress);
  const priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', contractAddress);
  const sprinkler = await ethers.getContractAt('SprinklerUpgradeable', contractAddress);
  const auction = await ethers.getContractAt('AuctionUpgradeable', contractAddress);
  const [deployer] = await ethers.getSigners();
  await mintAllTokensForTesting(deployer.address);
  await initPriceOracles(priceOracle);
  await initSprinkler(sprinkler);
  await initWaterTower(waterTower);
  await initAuction(auction);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
