import { ethers } from 'hardhat';
import * as networkHelpers from '@nomicfoundation/hardhat-network-helpers';
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
  fromD6,
} from '../../scripts/common';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  AuctionUpgradeable,
  IBean,
  IBeanstalkUpgradeable,
  MockERC20Upgradeable,
  TrancheBondUpgradeable,
  TrancheNotationUpgradeable,
  WaterCommonUpgradeable,
} from '../../typechain-types';
import { AuctionType } from '../types';
import { MockERC20D6Upgradeable } from '../../typechain-types/contracts/mock/MockERC20D6Upgradeable';
import { BigNumber } from 'ethers';
import { getBean, getBeanMetapool, getBeanstalk, getUsdc, mintUsdc } from '../utils/mint';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';

export function suite() {
  describe('Irrigation Tranche Testing', async function () {
    let rootAddress: string;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
    let usdc: IBean;
    let usdt: MockERC20D6Upgradeable;
    let water: MockERC20Upgradeable;
    let root: MockERC20Upgradeable;
    let liquidPods: MockERC20Upgradeable;
    let ohmBonds: MockERC20Upgradeable;
    let sender: SignerWithAddress;
    let secondBidder: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;
    let trancheBond: TrancheBondUpgradeable;
    let trancheNotation: TrancheNotationUpgradeable;
    let waterCommon: WaterCommonUpgradeable;
    let fundAddress: string;
    let podsGroup: any;
    let bean: IBean;
    let beanstalk: IBeanstalkUpgradeable;

    before(async () => {
      rootAddress = irrigationDiamond.address;
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];

      const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');
      const mockTokenD6Contract = await ethers.getContractFactory('MockERC20D6Upgradeable');
      token1 = await mockTokenContract.deploy();
      await token1.Token_Initialize('Beanstalk', 'BEAN', toWei(100_000_000));
      token2 = await mockTokenContract.deploy();
      await token2.Token_Initialize('Olympus', 'GOHM', toWei(100_000_000));
      water = await mockTokenContract.deploy();
      await water.Token_Initialize('Irrigation', 'WATER', toWei(100_000_000));
      root = await mockTokenContract.deploy();
      await root.Token_Initialize('Root', 'ROOT', toWei(100_000_000));
      liquidPods = await mockTokenContract.deploy();
      await liquidPods.Token_Initialize('LiquidPods', 'PODS', toWei(100_000_000));
      ohmBonds = await mockTokenContract.deploy();
      await ohmBonds.Token_Initialize('OHM Bonds', 'BOND', toWei(100_000_000));

      // deploy stable tokens
      dai = await mockTokenContract.deploy();
      await dai.Token_Initialize('DAI', 'DAI Stable', toWei(100_000_000));
      usdt = await mockTokenContract.deploy();
      await usdt.Token_Initialize('USDT Stable', 'USDT', toWei(100_000_000));

      // sends tokens to UI work account
      fundAddress = process.env.ADDRESS_TO_FUND;
      if (fundAddress) {
        await usdc.transfer(fundAddress, toD6(1000));
        expect(await usdc.balanceOf(fundAddress)).to.be.equal(toD6(1000));
      }

      sender = signers[1];

      // secondBidder = signers[2];
      // auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      // await auctionContract.setPurchaseToken(dai.address, true);
      // await auctionContract.setPurchaseToken(usdc.address, true);
      // expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
      // // 1.5% auction fee
      // await auctionContract.setAuctionFee(15, signers[2].address);
      // expect((await auctionContract.getAuctionFee()).numerator).to.be.eq(BigNumber.from(15));
    });
    it('Testing Tranche create', async () => {
      usdc = await getUsdc();
      await mintUsdc(owner.address, toD6(100_000));
      /// buy beans and pods and assign
      const beanMetaPool = await getBeanMetapool();
      await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
      await beanMetaPool.exchange_underlying('2', '0', toD6(1000), '0');
      bean = await getBean();
      beanstalk = await getBeanstalk();
      await bean.approve(beanstalk.address, ethers.constants.MaxUint256);
      let podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(100), 0);
      let podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup = { indexes: [podIndex], amounts: [podsAmount] };
      // console.log('---first:', fromD6(podIndex), fromD6(podsAmount));
      podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(40), 0);
      podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup.indexes.push(podIndex);
      podsGroup.amounts.push(podsAmount);
      // console.log('---second:', fromD6(podIndex), fromD6(podsAmount));
      waterCommon = await ethers.getContractAt('WaterCommonUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheNotation = await ethers.getContractAt('TrancheNotationUpgradeable', rootAddress);
      await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
      await trancheBond.createTranchesWithPods(podsGroup.indexes, [0, 0], podsGroup.amounts);
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      const tranchePods = await trancheBond.getTranchePods(3);
      assert(fromWei(trNotationBalance) > 0, `notaion balance is ${trNotationBalance}`);
      assert(
        fromWei(trNotationBalance) === fromWei(tranchePods.depositPods.fmv.mul(20).div(100)),
        `expected balance is ${fromWei(
          tranchePods.depositPods.fmv.mul(20).div(100),
        )}, but ${fromWei(trNotationBalance)} `,
      );

      // console.log(await trancheBond.getTranchePods(3));
      // console.log(await trancheNotation.balanceOfTrNotation(3, owner.address));
    });
  });
}
