import { ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  dc,
  assert,
  expect,
  toWei,
  fromWei,
  toD6,
  fromD6,
} from '../../scripts/common';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  AuctionUpgradeable,
  IBean,
  IBeanstalkUpgradeable,
  IERC20Upgradeable,
  PriceOracleUpgradeable,
  TrancheBondUpgradeable,
  TrancheNotationUpgradeable,
  WaterTowerUpgradeable,
} from '../../typechain-types';
import { AuctionType } from '../types';
import { getBean, getBeanMetapool, getBeanstalk, getUsdc } from '../utils/mint';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { skipTime } from '../utils/time';

export function suite() {
  describe('Irrigation Tranche Testing', async function () {
    let rootAddress: string;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let dai: IERC20Upgradeable;
    let usdc: IBean;
    let usdt: IERC20Upgradeable;
    let sender: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;
    let trancheBond: TrancheBondUpgradeable;
    let trancheNotation: TrancheNotationUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    let priceOracle: PriceOracleUpgradeable;
    let podsGroup: any;
    let bean: IBean;
    let beanstalk: IBeanstalkUpgradeable;

    before(async () => {
      rootAddress = irrigationDiamond.address;
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];

      // get stable tokens
      dai = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.DAI);
      usdt = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.USDT);

      sender = signers[1];
      usdc = await getUsdc();
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', rootAddress);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', rootAddress);
      priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheNotation = await ethers.getContractAt('TrancheNotationUpgradeable', rootAddress);
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
      await beanstalk.sow(toD6(100), 0, 0);
      let podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup = { indexes: [podIndex], amounts: [podsAmount] };
      // console.log('---first:', fromD6(podIndex), fromD6(podsAmount));
      podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(40), 0, 0);
      // simulate separate podlines      
      podIndex = await beanstalk.podIndex();
      await beanstalk.sow(toD6(100), 0, 0);
      podsAmount = await beanstalk.plot(owner.address, podIndex);
      podsGroup.indexes.push(podIndex);
      podsGroup.amounts.push(podsAmount);
      // console.log('---second:', fromD6(podIndex), fromD6(podsAmount));
      await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
      const water = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      const waterTower = await ethers.getContractAt('WaterTowerUpgradeable', irrigationDiamond.address);
      await water.approve(waterTower.address, toWei(32));
      await waterTower.deposit(toWei(32), false);
      await trancheBond.createTranchesWithPods(
        podsGroup.indexes,
        podsGroup.indexes.map(e => 0),
        podsGroup.amounts,
        180 * 86400);

      const priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', irrigationDiamond.address);
      const beanPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.BEAN);
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      const { tranche, depositPods } = await trancheBond.getTranchePods(3);
      assert(fromWei(trNotationBalance) > 0, `notaion balance is ${trNotationBalance}`);
      const expectedBalance = depositPods.fmv.mul(20).div(100).mul(beanPrice).div(toWei(1));
      assert(
        fromWei(trNotationBalance) === fromWei(expectedBalance),
        `expected balance is ${fromWei(expectedBalance)}, but ${fromWei(trNotationBalance)} `,
      );
    });

    it('total supply of tranche notation should be same as owner notation balance', async () => {
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(3, owner.address);
      let trTotalSupply = await trancheNotation.getTotalSupply(3);
      expect(trNotationBalance).to.be.eq(trTotalSupply);
    });

    it('not eligible user should fail creating tranche with pods', async () => {
      await expect(trancheBond.connect(signers[3]).createTranchesWithPods(podsGroup.indexes, [0, 0], podsGroup.amounts, 0)).to.be.revertedWithCustomError(trancheBond, 'NotEligible');
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

    it('Test Tranche Auction for z tranche should be failed ', async () => {
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
          { value: toWei(0.01) }
        ),
      ).to.be.revertedWith('not list Z tranche');
    });

    it('Test Tranche Auction create', async () => {
      let trancheIndex = 4;
      let trNotationBalance = await trancheNotation.balanceOfTrNotation(
        trancheIndex,
        owner.address,
      );
      let updateOwnerBalance = await ethers.provider.getBalance(owner.address);
      let updateContractBalance = await ethers.provider.getBalance(rootAddress);
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
        { value: toWei(0.02) }
      );
      let txReceipt = await tx.wait();
      const totalGas = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);
      updateOwnerBalance = updateOwnerBalance.sub(await ethers.provider.getBalance(owner.address)).sub(totalGas);
      updateContractBalance = (await ethers.provider.getBalance(rootAddress)).sub(updateContractBalance);
      expect(updateOwnerBalance).to.be.eq(updateContractBalance);
      expect(updateContractBalance).to.be.gt(toWei(0.0001));
      expect(updateOwnerBalance).to.be.lt(toWei(0.003));
      expect(await trancheNotation.balanceOfTrNotation(trancheIndex, rootAddress)).to.be.equal(
        trNotationBalance,
      );
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
      await skipTime(86400 * 4 + 3600);
      let updateTotalRewards = await waterTower.getTotalRewards();
      let updateEther = await ethers.provider.getBalance(rootAddress);
      const tx = await expect(auctionContract
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
        )).to.be.revertedWithCustomError(auctionContract, 'InsufficientFee');
      const beanPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.BEAN);
      const auctionFee = trNotationBalance.mul(beanPrice).div(toWei(1)).mul(15).div(1000);
      await auctionContract
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
          { value: auctionFee }
        );
      updateTotalRewards = (await waterTower.getTotalRewards()).sub(updateTotalRewards);
      updateEther = (await (ethers.provider.getBalance(rootAddress))).sub(updateEther);
      expect(updateTotalRewards).to.be.eq(updateEther);
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
      await skipTime(86400 * 6 + 3601);
      const trancheIndex = 4;
      const seller = sender;
      const bidder = owner;
      const auctionId = await auctionContract.getAuctionsCount();
      let bidderBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, bidder.address);
      assert(bidderBalance.eq(0), `expected tranche notation is 0, but ${bidderBalance}`);
      await auctionContract.connect(seller).closeAuction(auctionId);
      const auction = await auctionContract.getAuction(auctionId);
      bidderBalance = await trancheNotation.balanceOfTrNotation(trancheIndex, bidder.address);
      assert(
        bidderBalance.gt(0) && bidderBalance.eq(auction.sellAmount),
        `expected sell amount ${auction.sellAmount}, but ${bidderBalance}`,
      );
    });

    it('should be able to receive pods correct for tranche A', async () => {
      const { depositPods } = await trancheBond.getTranchePods(3);
      const { offset, pods } = await trancheBond.getAvailablePodsForUser(3, sender.address);
      expect(offset).to.be.eq(0);
      expect(pods).to.be.eq(depositPods.totalPods.mul(20).div(100));
    });

    it('should be able to receive pods correct for tranche B', async () => {
      const { depositPods } = await trancheBond.getTranchePods(4);
      const { offset, pods } = await trancheBond.getAvailablePodsForUser(4, owner.address);
      expect(offset).to.be.eq(depositPods.totalPods.mul(20).div(100));
      expect(pods).to.be.eq(depositPods.totalPods.mul(30).div(100));
    });

    it('should revert with not mature error before maturity period is over ', async () => {
      await expect(trancheBond.receivePodsWithTranches(4)).to.be.revertedWithCustomError(trancheBond, 'NotMatureTranche');
      await expect(trancheBond.receivePodsWithTranches(5)).to.be.revertedWithCustomError(trancheBond, 'NotMatureTranche');
    });

    it('should revert with insuffifient pods error when user tranche balance is 0 or too small, so calculated pods is 0', async () => {
      await skipTime(86400 * 180);
      expect(await trancheNotation.balanceOfTrNotation(5, sender.address)).to.be.eq(0);
      await expect(trancheBond.connect(sender).receivePodsWithTranches(5)).to.be.revertedWithCustomError(trancheBond, 'InsufficientPods');
    });

    it('should receive pods after the tranche A is mature', async () => {
      let { tranche, depositPods } = await trancheBond.getTranchePods(3);
      const oldPods = await beanstalk.plot(trancheBond.address, depositPods.underlyingPodIndexes[0])
      const tx = await trancheBond.connect(sender).receivePodsWithTranches(3);
      const pods = await beanstalk.plot(sender.address, depositPods.underlyingPodIndexes[0])
      const pods2 = await beanstalk.plot(sender.address, depositPods.underlyingPodIndexes[1])
      const expectedReceivePods = depositPods.totalPods.mul(20).div(100);
      expect(pods.add(pods2)).to.be.eq(depositPods.totalPods.mul(20).div(100));
      depositPods = (await trancheBond.getTranchePods(3)).depositPods;
      if (expectedReceivePods.gt(oldPods)) {
        expect(depositPods.startIndexAndOffsets[0]).to.be.eq(1);
        expect(depositPods.startIndexAndOffsets[3]).to.be.eq(expectedReceivePods.sub(pods));
      }
      else {
        expect(depositPods.startIndexAndOffsets[0]).to.be.eq(0);
        expect(depositPods.startIndexAndOffsets[3]).to.be.eq(expectedReceivePods);
      }
    });

    it('should receive pods after the tranche B is mature', async () => {
      let { tranche, depositPods } = await trancheBond.getTranchePods(4);
      const { offset, pods } = await trancheBond.getAvailablePodsForUser(4, owner.address);
      const tx = await trancheBond.receivePodsWithTranches(4);
      depositPods = (await trancheBond.getTranchePods(4)).depositPods;      
      const receivePods = await beanstalk.plot(owner.address, depositPods.underlyingPodIndexes[0].add(offset));
      expect(pods).to.be.eq(receivePods);
    });

    it('should receive pods after the tranche Z is mature', async () => {
      let { tranche, depositPods } = await trancheBond.getTranchePods(5);
      const { offset, pods } = await trancheBond.getAvailablePodsForUser(5, owner.address);
      const tx = await trancheBond.receivePodsWithTranches(5);
      depositPods = (await trancheBond.getTranchePods(5)).depositPods;
      const receivePods = await beanstalk.plot(owner.address, depositPods.underlyingPodIndexes[1]);
      expect(pods).to.be.eq(receivePods);
    });
  });
}
