import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { impersonateSigner } from './signer';
import { toWei } from '../../scripts/common';

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
  await deployer.sendTransaction({to: signer.address, value: toWei(0.2)});  
  await usdc.connect(signer).mint(address, amount);
}
