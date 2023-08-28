import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { impersonateSigner, setEtherBalance } from './signer';
import { toD6, toWei } from '../../scripts/common';

const tokenHolders = {
  ROOT: '0xa3A7B6F88361F48403514059F1F16C8E78d60EeC',
  SPOT: '0x664F743A378A430b4416B51922178fc68e5B699D',
  PAXG: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
  CNHT: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
};

export async function getUsdc() {
  return await ethers.getContractAt('IBean', CONTRACT_ADDRESSES.USDC);
}

export async function getBean() {
  return await ethers.getContractAt('IBean', CONTRACT_ADDRESSES.BEAN);
}

export async function getBeanstalk() {
  return await ethers.getContractAt('IBeanstalkUpgradeable', CONTRACT_ADDRESSES.BEANSTALK);
}

export async function getBeanMetapool() {
  return await ethers.getContractAt('ICurvePool', CONTRACT_ADDRESSES.BEAN_3_CURVE);
}

export async function mintUsdc(address: string, amount: BigNumber) {
  const [deployer] = await ethers.getSigners();
  const signer = await impersonateSigner(CONTRACT_ADDRESSES.USDC_MINTER);
  const usdc = await getUsdc();
  await deployer.sendTransaction({ to: signer.address, value: toWei(0.2) });
  await usdc.connect(signer).mint(address, amount);
}

const toBytes32 = (bn) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

const setStorageAt = async (address, index, value) => {
  await ethers.provider.send('hardhat_setStorageAt', [address, index, value]);
  await ethers.provider.send('evm_mine', []); // Just mines to the next block
};

export async function mintERC20Token(
  tokenAddress: String,
  address: string,
  amount: BigNumber,
  slotIndex = 0,
) {
  const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [address, slotIndex]);
  await setStorageAt(tokenAddress, index.toString(), toBytes32(amount).toString());
}

async function mintLUSD(address: string, amount) {
  const signer = await impersonateSigner(CONTRACT_ADDRESSES.LUSD_MINTER);
  const lusd = await ethers.getContractAt('MockERC20Upgradeable', CONTRACT_ADDRESSES.LUSD);
  await setEtherBalance(signer.address, toWei(1));
  await lusd.connect(signer).mint(address, toWei(100_000));
}

async function mintWithTransfer(tokenAddress: string, from: string, address: string, amount) {
  const signer = await impersonateSigner(from);
  const token = await ethers.getContractAt('IERC20Upgradeable', tokenAddress);
  await setEtherBalance(signer.address, toWei(0.2));
  await token.connect(signer).transfer(address, amount);
}

export async function mintAllTokensForTesting(address: string) {
  /// mint tokens for deployer
  await mintUsdc(address, toD6(100_000));
  await mintERC20Token(CONTRACT_ADDRESSES.DAI, address, toWei(100_000), 2);
  await mintERC20Token(CONTRACT_ADDRESSES.USDT, address, toWei(100_000), 2);
  await mintERC20Token(CONTRACT_ADDRESSES.BEAN, address, toD6(100_000), 0);
  await mintWithTransfer(CONTRACT_ADDRESSES.ROOT, tokenHolders.ROOT, address, toWei(10_000));
  await mintERC20Token(CONTRACT_ADDRESSES.OHM, address, toWei(100_000), 0);
  await mintLUSD(address, toWei(100_000));
  await mintWithTransfer(CONTRACT_ADDRESSES.SPOT, tokenHolders.SPOT, address, toD6(100_000_000));
  await mintWithTransfer(CONTRACT_ADDRESSES.PAXG, tokenHolders.PAXG, address, toWei(10_000));
  await mintWithTransfer(CONTRACT_ADDRESSES.CNHT, tokenHolders.CNHT, address, toD6(100_000));
  await mintERC20Token(CONTRACT_ADDRESSES.frxETH, address, toWei(100_000), 0);
  await mintERC20Token(CONTRACT_ADDRESSES.UNRIPE_BEAN, address, toD6(100_000), 0);
}

export async function deployMockToken(name, symbol, mockDeployer, factoryAddress) {
  const factoryContract = await ethers.getContractAt(
    'CREATE3Factory',
    factoryAddress,
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

export const oldPlots = [
  {
    "farmer": {
      "id": "0xd79e92124a020410c238b23fb93c95b2922d0b9e"
    },
    "index": "160299068297321",
    "pods": "7664165865816"
  },
  {
    "farmer": {
      "id": "0x10bf1dcb5ab7860bab1c3320163c6dddf8dcc0e4"
    },
    "index": "345456176278838",
    "pods": "7622833600000"
  },
  {
    "farmer": {
      "id": "0x4a24e54a090b0fa060f7faaf561510775d314e84"
    },
    "index": "548233773854003",
    "pods": "8118000000000"
  },
  {
    "farmer": {
      "id": "0x15390a3c98fa5ba602f1b428bc21a3059362afaf"
    },
    "index": "672857205023752",
    "pods": "10622053659968"
  },
  {
    "farmer": {
      "id": "0x9a00beffa3fc064104b71f6b7ea93babdc44d9da"
    },
    "index": "747381568584998",
    "pods": "12828436637551"
  }
];

export async function getMockPlots() {
  const [owner] = await ethers.getSigners();
  const beanstalk = await getBeanstalk();
  for (let plot of oldPlots) {
    const account = plot.farmer.id;
    const signer = await impersonateSigner(account);
    await beanstalk.connect(signer).transferPlot(signer.address, owner.address, plot.index, 0, plot.pods);
  }
}