/**
 * this script initializes each facet contracts
 */
import { debug } from 'debug';
import { ethers } from 'hardhat';
import { CONTRACT_ADDRESSES, OracleType } from './shared';
import {
  AuctionUpgradeable,
  PriceOracleUpgradeable,
  SprinklerUpgradeable,
  WaterTowerUpgradeable,
} from '../typechain-types';
import { formatFixed, fromWei, toWei } from './common';

const debuglog: debug.Debugger = debug('IrrigationInit:log');
debuglog.color = '159';

export const whitelist = [
  CONTRACT_ADDRESSES.DAI,
  CONTRACT_ADDRESSES.USDT,
  CONTRACT_ADDRESSES.BEAN,
  CONTRACT_ADDRESSES.ROOT,
  CONTRACT_ADDRESSES.OHM,
  CONTRACT_ADDRESSES.LUSD,
  CONTRACT_ADDRESSES.SPOT,
  CONTRACT_ADDRESSES.PAXG,
  CONTRACT_ADDRESSES.CNHT,
  CONTRACT_ADDRESSES.ETHER
];
const purchaseTokens = [CONTRACT_ADDRESSES.DAI, CONTRACT_ADDRESSES.USDC, CONTRACT_ADDRESSES.USDT];
export async function initPriceOracles(priceOracle: PriceOracleUpgradeable) {
  const factory = await ethers.getContractFactory('BeanPriceOracle');
  const beanOracle = await factory.deploy(
    CONTRACT_ADDRESSES.BEAN_3_CURVE,
    CONTRACT_ADDRESSES.THREE_POOL,
  );
  await beanOracle.deployed();
  const defaultOracleData = [
    {
      symbol: 'ETH',
      asset: CONTRACT_ADDRESSES.ETHER,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_ETH,
      base: ethers.constants.AddressZero,
      oType: OracleType.CHAINLINK,
    },
    /// stable coins
    {
      symbol: 'USDC',
      asset: CONTRACT_ADDRESSES.USDC,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_USDC,
      base: ethers.constants.AddressZero,
      oType: OracleType.CHAINLINK,
    },
    {
      symbol: 'DAI',
      asset: CONTRACT_ADDRESSES.DAI,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_DAI,
      base: ethers.constants.AddressZero,
      oType: OracleType.CHAINLINK,
    },
    {
      symbol: 'USDT',
      asset: CONTRACT_ADDRESSES.USDT,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_USDT,
      base: ethers.constants.AddressZero,
      oType: OracleType.CHAINLINK,
    },
    {
      symbol: 'LUSD',
      asset: CONTRACT_ADDRESSES.LUSD,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_LUSD,
      base: ethers.constants.AddressZero,
      oType: OracleType.CHAINLINK,
    },
    ///
    {
      symbol: 'BEAN',
      asset: CONTRACT_ADDRESSES.BEAN,
      oracle: beanOracle.address,
      base: CONTRACT_ADDRESSES.DAI,
      oType: OracleType.CUSTOM_ORACLE,
    },
    {
      symbol: 'ROOT',
      asset: CONTRACT_ADDRESSES.ROOT,
      oracle: CONTRACT_ADDRESSES.UNIV3_POOL_ROOT,
      base: CONTRACT_ADDRESSES.BEAN,
      oType: OracleType.UNISWAP_V3,
    },
    {
      symbol: 'SPOT',
      asset: CONTRACT_ADDRESSES.SPOT,
      oracle: CONTRACT_ADDRESSES.UNIV3_POOL_SPOT,
      base: CONTRACT_ADDRESSES.USDC,
      oType: OracleType.UNISWAP_V3,
    },
    {
      symbol: 'OHM',
      asset: CONTRACT_ADDRESSES.OHM,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_OHM,
      base: CONTRACT_ADDRESSES.ETHER,
      oType: OracleType.CHAINLINK,
    },
    {
      symbol: 'PAXG',
      asset: CONTRACT_ADDRESSES.PAXG,
      oracle: CONTRACT_ADDRESSES.CHAINLINK_ORACLE_PAXG,
      base: CONTRACT_ADDRESSES.ETHER,
      oType: OracleType.CHAINLINK,
    },
    {
      symbol: 'CNHT',
      asset: CONTRACT_ADDRESSES.CNHT,
      oracle: CONTRACT_ADDRESSES.UNIV3_POOL_CNHT,
      base: CONTRACT_ADDRESSES.ETHER,
      oType: OracleType.UNISWAP_V3,
    },
  ];
  for (const o of defaultOracleData) {
    await priceOracle.setOracle(o.asset, o.oracle, o.base, o.oType);
    debuglog(`${o.symbol} price: ${formatFixed(fromWei(await priceOracle.getPrice(o.asset)))}`);
  }
  await priceOracle.setDirectPrice(priceOracle.address, toWei(0.5));
  debuglog(`WATER price: ${formatFixed(fromWei(await priceOracle.getPrice(priceOracle.address)))}`);
}

export async function initSprinkler(sprinkler: SprinklerUpgradeable) {
  for (const address of whitelist) {
    await sprinkler.addAssetToWhiteList(address, 0);
    const waterToken = await ethers.getContractAt('WaterUpgradeable', sprinkler.address);
    await waterToken.approve(sprinkler.address, toWei(10_000));
  }
  await sprinkler.depositWater(toWei(10_000));
}

export async function initWaterTower(waterTower: WaterTowerUpgradeable) {
  await waterTower.setMiddleAsset(CONTRACT_ADDRESSES.BEAN);
  // added bonus for irrigating is 5%
  await waterTower.setIrrigateBonusRate(5);
  // calculate month end
  let date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  await waterTower.setPool(Math.floor(date.getTime() / 1000), 0);
}

export async function initAuction(auction: AuctionUpgradeable) {
  const signers = await ethers.getSigners();
  for (const token of purchaseTokens) {
    await auction.setPurchaseToken(token, true);
  }
  // 1.5% auction fee
  await auction.setAuctionFee(15, signers[2]?.address || process.env.REWARD_ADDRESS);
}

export async function initTrancheBond(contractAddress: string) {
  const erc1155whitelist = await ethers.getContractAt('ERC1155WhitelistUpgradeable', contractAddress);
  await erc1155whitelist.addProxySpender(contractAddress,  ethers.utils.formatBytes32String('Irrigation'));  
  await erc1155whitelist.setTokenBaseURI(process.env.TRANCHE_NFT_METADATA_BASE_URL);
}

export async function initAll(contractAddress: string) {
  const waterTower = await ethers.getContractAt('WaterTowerUpgradeable', contractAddress);
  const priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', contractAddress);
  const sprinkler = await ethers.getContractAt('SprinklerUpgradeable', contractAddress);
  const auction = await ethers.getContractAt('AuctionUpgradeable', contractAddress);
  await initPriceOracles(priceOracle);
  await initSprinkler(sprinkler);
  await initWaterTower(waterTower);
  await initAuction(auction);
  await initTrancheBond(contractAddress);
}