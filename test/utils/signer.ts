import hre, { ethers } from 'hardhat';

export async function impersonateSigner(signerAddress) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [signerAddress],
  });
  return await ethers.getSigner(signerAddress);
}
