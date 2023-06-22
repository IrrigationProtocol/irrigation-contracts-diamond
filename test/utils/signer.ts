import hre, { ethers } from 'hardhat';
import { toWei } from '../../scripts/common';

export async function impersonateSigner(signerAddress) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [signerAddress],
  });
  return await ethers.getSigner(signerAddress);
}

export async function setEtherBalance(address, amount) {
  await hre.network.provider.send('hardhat_setBalance', [address, amount.toHexString().replace('0x0', '0x')]);
}