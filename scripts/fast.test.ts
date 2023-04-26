import hre, { ethers } from 'hardhat';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomiclabs/hardhat-ethers';
import { dc, debuglog, assert, INetworkDeployInfo, toWei } from './common';

import { getBean } from '../test/utils/mint';
async function main() {
  const [owner] = await ethers.getSigners();
  const amount = toWei(5);
  const mockSwapContractFactory = await ethers.getContractFactory('MockSwap');
  const mockSwap = await mockSwapContractFactory.deploy();
  const bean = await getBean();
  console.log(await bean.balanceOf(mockSwap.address));  
  await owner.sendTransaction({ to: mockSwap.address, value: toWei(100) });
  console.log('ether: ', await ethers.provider.getBalance(mockSwap.address));
  await mockSwap.mockSwap(amount, { value: 0 });
  console.log('ether after swap: ', await ethers.provider.getBalance(mockSwap.address));
  console.log('bean after swap: ', await bean.balanceOf(mockSwap.address), await mockSwap.swappedAmount());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
