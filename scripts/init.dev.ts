/**
 * @title After we deploy contracts, initialize contracts by making whitelist on sprinkler, auctions, farmer's market
 *        And, on develop chain, we will deploy mock tokens for testing
 *        Initialization is required one time only
 */
import { debug } from 'debug';
import hre, { config, ethers } from 'hardhat';
import { toWei, toD6, fromD6, fromWei } from './common';
import { getUsdc, mintUsdc, getBeanMetapool, getBean, getBeanstalk } from '../test/utils/mint';
import { deployments } from './deployments';
import { BigNumber } from 'ethers';
import tokenData from '../test/mockTokens.json';
import fs from 'fs';

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
    irrigation: deployments[networkName]?.DiamondAddress,
    dai: '0x46d4674578a2daBbD0CEAB0500c6c7867999db34',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0xfB12F7170FF298CDed84C793dAb9aBBEcc01E798',
    bean: '0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab',
    ohm: '0x447786d977Ea11Ad0600E193b2d07A06EfB53e5F',
    water: deployments[networkName]?.DiamondAddress,
    root: '0x4CF4dd3f71B67a7622ac250f8b10d266Dc5aEbcE',
    liquidPods: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
    ohmBonds: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42',
  },
  local: {
    irrigation: deployments[networkName]?.DiamondAddress,
    dai: '0x46d4674578a2daBbD0CEAB0500c6c7867999db34',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0xfB12F7170FF298CDed84C793dAb9aBBEcc01E798',
    bean: '0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab',
    ohm: '0x447786d977Ea11Ad0600E193b2d07A06EfB53e5F',
    water: deployments[networkName]?.DiamondAddress,
    root: '0x2Dc6a55aa30e3d3795fC630377e92574FCa27AC4',
    liquidPods: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
    ohmBonds: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42',
  },
};

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

async function setMockPriceOracle(mockDeployer, tokenSymbol, price) {
  let tokenAddress = tokenData.find((e) => e.symbol === tokenSymbol)?.addresses?.[networkName];
  if (tokenSymbol === 'WATER') tokenAddress = deployments[networkName].DiamondAddress;
  if (!tokenAddress) {
    log(`failed deploying mock price oracle ${tokenSymbol}`);
  }
  const factoryContract = await ethers.getContractAt(
    'CREATE3Factory',
    deployments[networkName].FactoryAddress,
  );
  const mockTokenContract = await ethers.getContractFactory('MockPriceOracle');
  const salt = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(`Irrigation:MockPrice:${tokenSymbol}`),
  );
  await factoryContract
    .connect(mockDeployer)
    .deploy(salt, mockTokenContract.bytecode, [], { value: 0 });
  const mockPriceOracleAddress = await factoryContract.getDeployed(mockDeployer.address, salt);
  const priceOracle = await ethers.getContractAt('MockPriceOracle', mockPriceOracleAddress);
  await priceOracle.mockSetPrice(toWei(price));
  log(`deployed mock oracle ${tokenSymbol} ${priceOracle.address}`);
  return { priceOracle: priceOracle.address, tokenAddress };
}

async function deployMocTokens() {
  const [deployer] = await ethers.getSigners();
  const mockDeployer = new ethers.Wallet(process.env.MOCK_DEPLOYER_KEY).connect(deployer.provider);
  let ethBalance = await ethers.provider.getBalance(mockDeployer.address);

  if (ethBalance.lt(BigNumber.from(toWei(0.05)))) {
    await deployer.sendTransaction({
      to: mockDeployer.address,
      value: ethers.utils.parseEther('10'),
      gasLimit: 21000,
    });
  }
  ethBalance = await ethers.provider.getBalance(mockDeployer.address);
  for (const token of tokenData) {
    if (!token.addresses?.[networkName]) {
      const tokenAddress = await deployMockToken(mockDeployer, token.name, token.symbol);
      log(`deployed mock token: ${token.name} ${tokenAddress}`);
      if (token.addresses) token.addresses[networkName] = tokenAddress;
      else token.addresses = { [networkName]: tokenAddress };
    }
  }
  fs.writeFileSync(`test/mockTokens.json`, JSON.stringify(tokenData));
  if (networkName !== 'goerli') {
    const signers = await ethers.getSigners();
    const usdc = await getUsdc();
    await mintUsdc(signers[0].address, toD6(100_000_000));
    // const usdcBalance = await usdc.balanceOf(signers[0].address);
    // log(`minted USDC. usdc balance is ${fromWei(usdcBalance)}`);
  }
}

async function initAuction() {
  const signers = await ethers.getSigners();
  const auctionContract = await ethers.getContractAt(
    'AuctionUpgradeable',
    devAddresses[networkName].irrigation,
  );
  const daiAddress = tokenData.find((e) => e.symbol === 'DAI')?.addresses[networkName];
  const usdtAddress = tokenData.find((e) => e.symbol === 'USDT')?.addresses[networkName];
  if (!daiAddress || !usdtAddress) {
    log(`no dai address! failed init for auction`);
    return;
  }
  await auctionContract.setPurchaseToken(daiAddress, true);
  await auctionContract.setPurchaseToken(devAddresses[networkName].usdc, true);
  await auctionContract.setPurchaseToken(usdtAddress, true);
  // 1.5% auction fee
  await auctionContract.setAuctionFee(15, signers[2]?.address || process.env.REWARD_ADDRESS);
}

async function initSprinkler() {
  log(`initializing sprinkler`);
  const sprinkler = await ethers.getContractAt(
    'SprinklerUpgradeable',
    devAddresses[networkName].irrigation,
  );
  const whitelist = ['ROOT', 'GOHM', 'PODS', 'BOND'];
  const price = {
    ROOT: 0.92,
    GOHM: 20,
    PODS: 0.2,
    BOND: 10,
  };
  const [deployer] = await ethers.getSigners();
  const mockDeployer = new ethers.Wallet(process.env.MOCK_DEPLOYER_KEY).connect(deployer.provider);
  for (let token of whitelist) {
    const tokenItem = tokenData.find((e) => e.symbol === token);
    const { tokenAddress, priceOracle } = await setMockPriceOracle(
      mockDeployer,
      token,
      price[token],
    );
    // await sprinkler.setPriceOracle(tokenAddress, priceOracle);
    await sprinkler.addAssetToWhiteList(tokenAddress, priceOracle, 0);
    if (tokenItem?.priceOracles) tokenItem.priceOracles[networkName] = priceOracle;
    else tokenItem.priceOracles = { [networkName]: priceOracle };
  }
  fs.writeFileSync(`test/mockTokens.json`, JSON.stringify(tokenData));
  const { tokenAddress, priceOracle } = await setMockPriceOracle(mockDeployer, 'WATER', 0.2);
  await sprinkler.setWaterPriceOracle(priceOracle);
  log(`price oracle of WATER: ${priceOracle}`);
}

async function mintBean() {
  log(`minting Bean`);
  const signers = await ethers.getSigners();
  const beanMetaPool = await getBeanMetapool();
  const usdc = await getUsdc();
  await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
  await beanMetaPool.exchange_underlying('2', '0', toD6(1_000_000), '0');
  const bean = await getBean();
  // console.log(bean.address);
  // const beanBalance = await bean.balanceOf(signers[0].address);
  // log(`minted Bean. bean balance is ${fromD6(beanBalance)}`);
  log(`minted Bean.`);
}

async function main() {
  if (require.main === module) {
    debug.enable('Irrigation.*:log');
  }
  log(`initialize contracts on ${networkName}`);
  const waterCommonContract = await ethers.getContractAt(
    'WaterCommonUpgradeable',
    devAddresses[networkName].irrigation,
  );
  try {
    const beanstalk = await waterCommonContract.beanstalk();
    log(`beanstalk: `, beanstalk);
  } catch {}

  await deployMocTokens();
  await mintBean();
  await initAuction();
  await initSprinkler();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
