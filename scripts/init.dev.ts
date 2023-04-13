import { debug } from 'debug';
import hre, { ethers } from 'hardhat';
import { toWei, toD6, fromD6 } from './common';
import { getUsdc, mintUsdc, getBeanMetapool, getBean, getBeanstalk } from '../test/utils/mint';
import { deployments } from './deployments';

const log: debug.Debugger = debug('IrrigationDeploy:log');
log.color = '159';

const networkName = hre.network.name;
const devAddresses = {
  goerli: {
    irrigation: deployments[networkName]?.DiamondAddress,
    dai: '0x9CF96Bfa5327a10691EeD3003E81d6E23C04F7E3',
    usdc: '0x97a6E633Af8FFd2345Be039F1208E2E67dE5B0a5',
    usdt: '0xdCE3451Cf2Fc33fBdc299BF98455874DCf68CA90',
    bean: '0xf043a376d6aD947722844173E7B998240D1a7385',
    ohm: '0xAeE30c83EcCc84d94e8d653c2ba6DfFCA9730bCf',
    water: deployments[networkName]?.DiamondAddress,
    root: '0x9c46eC7364e5B37fF427fb1c846c6bBD946Ddb58',
    liquidPods: '0x3c9308B01181aaf5467fAbca03B7b7C7778180c8',
    ohmBonds: '0xA91a2aA21Fe7Af98529fF4f550B6cfD003E0611A',
  },
  dev: {
    irrigation: deployments[networkName]?.DeployerAddress,
    dai: '0x4ea0Be853219be8C9cE27200Bdeee36881612FF2',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0x9155497EAE31D432C0b13dBCc0615a37f55a2c87',
  },
};

async function deployMocTokens() {
  const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');

  const root = await mockTokenContract.deploy();
  await root.Token_Initialize('Root', 'ROOT', toWei(100_000_000));
  log(`address of Root, ${root.address}`);
  let token = await mockTokenContract.deploy();
  await token.Token_Initialize('Olympus', 'GOHM', toWei(100_000_000));
  log(`address of GOHM, ${token.address}`);

  const liquidPods = await mockTokenContract.deploy();
  await liquidPods.Token_Initialize('LiquidPods', 'PODS', toWei(100_000_000));
  log(`address of liquidPods, ${liquidPods.address}`);

  const ohmBonds = await mockTokenContract.deploy();
  await ohmBonds.Token_Initialize('OHM Bonds', 'BOND', toWei(100_000_000));
  log(`address of ohm bonds, ${ohmBonds.address}`);

  // deploy stable tokens
  const dai = await mockTokenContract.deploy();

  await dai.Token_Initialize('DAI', 'DAI Stable', toWei(100_000_000));
  log(`address of dai, ${dai.address}`);
  const usdt = await mockTokenContract.deploy();

  await usdt.Token_Initialize('USDT Stable', 'USDT', toWei(100_000_000));
  log(`address of usdt, ${usdt.address}`);

  const signers = await ethers.getSigners();
  const usdc = await getUsdc();
  log(`address of usdc, ${usdc.address}`);
  await mintUsdc(signers[0].address, toD6(100_000_000));
}

async function initAuction() {
  const signers = await ethers.getSigners();
  const auctionContract = await ethers.getContractAt(
    'AuctionUpgradeable',
    devAddresses[networkName].irrigation,
  );
  await auctionContract.setPurchaseToken(devAddresses[networkName].dai, true);
  await auctionContract.setPurchaseToken(devAddresses[networkName].usdc, true);
  await auctionContract.setPurchaseToken(devAddresses[networkName].usdt, true);
  // 1.5% auction fee
  await auctionContract.setAuctionFee(15, signers[2]?.address || process.env.REWARD_ADDRESS);
}

async function initSprinkler() {
  const sprinkler = await ethers.getContractAt(
    'SprinklerUpgradeable',
    devAddresses[networkName].irrigation,
  );
  const priceOracleContract = await ethers.getContractFactory('MockPriceOracle');
  const whitelist = ['bean', 'ohm', 'liquidPods', 'ohmBonds'];
  const price = {
    bean: 0.92,
    ohm: 20,
    liquidPods: 0.2,
    ohmBonds: 10,
  };

  for (let token of whitelist) {
    const tokenAddress = devAddresses[networkName][token];
    const priceOracle = await priceOracleContract.deploy();
    await sprinkler.addAssetToWhiteList(tokenAddress, priceOracle.address, 0);
    await priceOracle.mockSetPrice(toWei(price[token]));
  }
  const priceOracleForWater = await priceOracleContract.deploy();
  await priceOracleForWater.mockSetPrice(toWei(0.2));
  await sprinkler.setWaterPriceOracle(priceOracleForWater.address);
}

async function mintBean() {
  const signers = await ethers.getSigners();
  // const waterCommon = await ethers.getContractAt(
  //   'WaterCommonUpgradeable',
  //   devAddresses[networkName].irrigation,
  // );
  const beanMetaPool = await getBeanMetapool();
  const usdc = await getUsdc();
  await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
  await beanMetaPool.exchange_underlying('2', '0', toD6(1_000_000), '0');
  const bean = await getBean();
  const beanBalance = await bean.balanceOf(signers[0].address);
  log(`bean balance is ${fromD6(beanBalance)}`);
}
async function main() {
  if (require.main === module) {
    debug.enable('Irrigation.*:log');
  }
  log(`initialize contracts on ${networkName}`);
  // await deployMocTokens();
  // await mintBean();
  await initAuction();
  await initSprinkler();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
