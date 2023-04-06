import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { impersonateSigner } from './signer';

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
    return await ethers.getContractAt('ICurvePoolUpgradeable', CONTRACT_ADDRESSES.BEAN_3_CURVE);
}

export async function mintUsdc(address: string, amount: BigNumber) {
  const signer = await impersonateSigner(CONTRACT_ADDRESSES.USDC_MINTER);
  const usdc = await getUsdc();
  await usdc.connect(signer).mint(address, amount);
}
