import { ethers, web3, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

import {
  dc,
  assert,
  expect,
  toWei,
  fromWei,
  toD6,
  toBN,
  mulDivRoundingUp,
} from '../../scripts/common';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { MockERC20Upgradeable, ZSCUpgradeable } from '../../typechain-types';
import { MockERC20D6Upgradeable } from '../../typechain-types/contracts/mock/MockERC20D6Upgradeable';

import Client from '@irrigation/zk-utils/src/client';
import bn128 from '@irrigation/zk-utils/src/utils/bn128';
import { delaySecond, getCurrentTime } from '../utils';
import { BigNumber } from 'ethers';
/**
 * simulate block time similar as real network because the block.timestamp value in the Hardhat network will not reflect the current time.
 */
const setSimulatedTime = async () => {
  let nowTime = Date.now();
  if (network.name === 'hardhat')
    await time.setNextBlockTimestamp(Math.floor((nowTime + 1000 + Math.random() * 2000) / 1000));
};
export function suite() {
  describe('Irrigation Zsc Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
    let usdc: MockERC20D6Upgradeable;
    let sender: SignerWithAddress;
    let secondBidder: SignerWithAddress;
    let zscContract: ZSCUpgradeable;
    let zscClient: Client;
    let secretKey;
    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');
      token1 = await mockTokenContract.deploy();
      await token1.Token_Initialize('Bean', 'BEAN', toWei(100_000_000));
      token2 = await mockTokenContract.deploy();
      await token2.Token_Initialize('Stalk', 'STALK', toWei(100_000_000));
      dai = await mockTokenContract.deploy();
      await dai.Token_Initialize('DAI', 'DAI Stable', toWei(100_000_000));
      const mockTokenD6Contract = await ethers.getContractFactory('MockERC20D6Upgradeable');
      usdc = await mockTokenD6Contract.deploy();
      await usdc.Token_Initialize('USDC', 'USDC', toD6(100_000_000));
      sender = signers[1];
      secondBidder = signers[2];
      zscContract = await ethers.getContractAt('ZSCUpgradeable', irrigationDiamond.address);
      await zscContract.init(token1.address, 16);
      zscClient = new Client(web3, zscContract, owner, signers);
    });

    it('Testing Zsc register', async () => {
      await zscClient.register();
    });

    it('Testing Zsc setting max public keys', async () => {
      await expect(zscContract.setMaxKeys(3)).to.be.revertedWith(
        'Max Number of Public Keys need to be a power of 2',
      );
      secretKey = bn128.randomScalar();
      const pubKey = bn128.curve.g.mul(secretKey);
      await zscContract.setPublicKeys(1, 0, [bn128.serialize(pubKey)]);
    });

    it('Testing Zsc deposit', async () => {
      await token1.approve(zscContract.address, toWei(1000));
      await setSimulatedTime();
      await zscClient.deposit(100);
      expect(await token1.balanceOf(owner.address)).be.to.equal(toWei(100_000_000).sub(100));
    });

    it('Testing Zsc withdraw', async () => {
      await delaySecond(2);
      // await setSimulatedTime(); // instead of calling here, call directly before withraw function of contract
      await zscClient.withdraw(10, setSimulatedTime);
      expect(await token1.balanceOf(owner.address)).be.to.equal(toWei(100_000_000).sub(90));
    });

    it('Testing Zsc decrypt', async () => {
      expect(
        await zscContract.decrypt(
          BigNumber.from(secretKey.fromRed().toString()),
          bn128.serialize(zscClient.account.keypair.y),
        ),
      ).to.be.equal(owner.address);
    });
  });
}
