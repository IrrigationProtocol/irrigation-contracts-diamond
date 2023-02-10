import { ethers, web3 } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

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
      await zscContract.init();
      await zscContract.setToken(token1.address);      
      zscClient = new Client(web3, zscContract, owner.address, signers);
      // expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
    });

    it('Testing Zsc register', async () => {
      await zscClient.register();      
    });
    it('Testing Zsc deposit', async () => {
      await token1.approve(zscContract.address, toWei(1000));
      await zscClient.deposit(100);
      expect((await token1.balanceOf(owner.address))).be.to.equal(toWei(100_000_000).sub(100));
    });
    it('Testing Zsc withdraw', async () => {      
      await zscClient.withdraw(10);
      expect((await token1.balanceOf(owner.address))).be.to.equal(toWei(100_000_000).sub(90));
    });
  });
}
