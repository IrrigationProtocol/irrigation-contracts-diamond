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

      sender = signers[1];
      usdc = await getUsdc();
      await mintUsdc(owner.address, toD6(100_000));
      // sends tokens to UI work account
      fundAddress = process.env.ADDRESS_TO_FUND;
      if (fundAddress) {
        await usdc.transfer(fundAddress, toD6(1000));
        expect(await usdc.balanceOf(fundAddress)).to.be.equal(toD6(1000));
      }

      // secondBidder = signers[2];
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      await auctionContract.setPurchaseToken(dai.address, true);
      await auctionContract.setPurchaseToken(usdc.address, true);
    });

    it('Test Tranche create', async () => {
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
    });

    it('Test Tranche deposit', async () => {
      const beanMetaPool = await getBeanMetapool();
      await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
      await beanMetaPool.exchange_underlying('2', '0', toD6(500), '0');
      bean = await getBean();
      beanstalk = await getBeanstalk();
      await bean.approve(beanstalk.address, ethers.constants.MaxUint256);
      let podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(50), 0);
      let podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup = { indexes: [podIndex], amounts: [podsAmount] };
      waterCommon = await ethers.getContractAt('WaterCommonUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheNotation = await ethers.getContractAt('TrancheNotationUpgradeable', rootAddress);
      await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
      await trancheBond.deposit(podsGroup.indexes, podsGroup.amounts);
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      const tranchePods = await trancheBond.getTranchePods(3);
      assert(fromWei(trNotationBalance) > 0, `notaion balance is ${trNotationBalance}`);
    });

    it('Test Tranche withdraw', async () => {
      const beanMetaPool = await getBeanMetapool();
      await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
      await beanMetaPool.exchange_underlying('2', '0', toD6(200), '0');
      bean = await getBean();
      beanstalk = await getBeanstalk();
      await bean.approve(beanstalk.address, ethers.constants.MaxUint256);
      let podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(20), 0);
      let podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup = { indexes: [podIndex], amounts: [podsAmount] };
      waterCommon = await ethers.getContractAt('WaterCommonUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheNotation = await ethers.getContractAt('TrancheNotationUpgradeable', rootAddress);
      await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
      await trancheBond.createTranchesWithPods(podsGroup.indexes, [0, 0], podsGroup.amounts);
      await trancheBond.withdraw(3, toD6(10));
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      assert(fromWei(trNotationBalance) > 0, `notaion balance is ${trNotationBalance}`);
    });

    it('Test Tranche transfer', async () => {
      const trancheIndex = 3;
      const trNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        owner.address,
      );
      await trancheNotation.transferFromTrNotation(
        trancheIndex,
        trNotationBalance,
        owner.address,
        sender.address,
      );
      const senderNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        sender.address,
      );
      assert(
        trNotationBalance.eq(senderNotationBalance),
        `expected balance after transfer, ${fromWei(trNotationBalance)} but ${fromWei(
          senderNotationBalance,
        )}`,
      );
    });

    it('Test Tranche Auction create', async () => {
      let trancheIndex = 4;
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        owner.address,
      );
      const tx = await auctionContract.createAuction(
        0,
        86400 * 2,
        ethers.constants.AddressZero,
        trancheIndex,
        trNotationBalance,
        toWei(0.0001),
        toWei(0.6),
        toWei(0.1),
        toWei(0.5),
        AuctionType.TimedAndFixed,
      );
      expect(await trancheNotation.balanceOfTrNotation(trancheIndex, rootAddress)).to.be.equal(
        trNotationBalance,
      );
    });

    it('Test Tranche Pods by FMV', async () => {
      // Buy beans and pods and assign
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
    
      waterCommon = await ethers.getContractAt('WaterCommonUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheNotation = await ethers.getContractAt('TrancheNotationUpgradeable', rootAddress);
    
      await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
      await trancheBond.createTranchesWithPods(podsGroup.indexes, [0, 0], podsGroup.amounts);
    
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      const tranchePods = await trancheBond.getTranchePods(3);
    
      // Calculate the expected FMV of the tranche pods
      const expectedFmv = fromWei(tranchePods.depositPods.fmv.mul(20).div(100));
    
      // Assert that the tranche pods' FMV is as expected
      assert.equal(fromWei(trNotationBalance), expectedFmv, 
        `Expected FMV is ${expectedFmv}, but got ${fromWei(trNotationBalance)} instead.`);
    });
    

    it('Test Tranche Z auction', async () => {
      const trancheIndex = 5;
      const trNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        owner.address,
      );
      await expect(
        auctionContract.createAuction(
          0,
          86400 * 2,
          ethers.constants.AddressZero,
          trancheIndex,
          trNotationBalance,
          toWei(0.0001),
          toWei(0.6),
          toWei(0.1),
          toWei(0.5),
          AuctionType.TimedAndFixed,
        ),
      ).to.be.revertedWith('not list Z tranche');
    });

    it('Test Tranche Auction buyNow', async () => {
      const trancheIndex = 4;
      const lastAuctionId = await auctionContract.getAuctionsCount();
      let auction = await auctionContract.getAuction(lastAuctionId);
      assert(
        auction.trancheIndex.eq(trancheIndex),
        `expected trancheIndex ${trancheIndex} but ${auction.trancheIndex}`,
      );
      assert(auction.assetType == 1, `expected assetType Tranche but ${auction.assetType}`);
      await dai.transfer(sender.address, toWei(50));
      await dai.connect(sender).approve(auctionContract.address, toWei(50));
      const trBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, rootAddress);
      await auctionContract.connect(sender).buyNow(lastAuctionId, trBalance, dai.address);
      const senderBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, sender.address);
      assert(
        senderBalance.eq(trBalance),
        `expected tranche notation ${fromWei(trBalance)} but ${fromWei(senderBalance)}`,
      );
      auction = await auctionContract.getAuction(lastAuctionId);
      assert(auction.reserve.eq(0), `expected reserve amount is 0 but ${fromWei(auction.reserve)}`);
    });

    it('Test Tranche Auction bid', async () => {
      const seller = sender;
      const bidder = owner;
      const trancheIndex = 4;
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        seller.address,
      );

      await networkHelpers.time.setNextBlockTimestamp(
        Math.floor(Date.now() / 1000) + 86400 * 4 + 3600,
      );

      const tx = await auctionContract
        .connect(seller)
        .createAuction(
          0,
          86400 * 2,
          ethers.constants.AddressZero,
          trancheIndex,
          trNotationBalance,
          toWei(0.0001),
          toWei(0.6),
          toWei(0.1),
          toWei(0.5),
          AuctionType.TimedAndFixed,
        );
      const lastAuctionId = await auctionContract.getAuctionsCount();
      let auction = await auctionContract.getAuction(lastAuctionId);
      assert(
        auction.trancheIndex.eq(trancheIndex),
        `expected trancheIndex ${trancheIndex} but ${auction.trancheIndex}`,
      );
      assert(auction.assetType == 1, `expected assetType Tranche but ${auction.assetType}`);

      await dai.connect(bidder).approve(auctionContract.address, toWei(50));
      let daiBalance = await dai.balanceOf(owner.address);
      const trBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, rootAddress);
      await auctionContract
        .connect(owner)
        .placeBid(lastAuctionId, trBalance, dai.address, toWei(2));
      const daiBalanceAfteBidding = await dai.balanceOf(owner.address);
      assert(
        daiBalanceAfteBidding.eq(daiBalance.sub(trBalance.mul(2))),
        `expected dai balance ${daiBalance.sub(trBalance.mul(2))}, but ${daiBalanceAfteBidding}`,
      );
    });
    it('Test Tranche Auction close', async () => {
      await networkHelpers.time.setNextBlockTimestamp(
        Math.floor(Date.now() / 1000) + 86400 * 6 + 3601,
      );
      const trancheIndex = 4;
      const seller = sender;
      const bidder = owner;
      const auctionId = await auctionContract.getAuctionsCount();
      let bidderBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, bidder.address);
      assert(bidderBalance.eq(0), `expected tranche notation is 0, but ${bidderBalance}`);
      await auctionContract.connect(sender).closeAuction(auctionId);
      const auction = await auctionContract.getAuction(auctionId);
      bidderBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, bidder.address);
      assert(
        bidderBalance.gt(0) && bidderBalance.eq(auction.sellAmount),
        `expected price ${auction.sellAmount}, but ${bidderBalance}`,
      );
    });
  });
}
