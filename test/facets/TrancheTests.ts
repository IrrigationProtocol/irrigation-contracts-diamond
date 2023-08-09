import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  dc,
  assert,
  expect,
  toWei,
  fromWei,
  toD6,
} from '../../scripts/common';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  AuctionUpgradeable,
  ERC1155WhitelistUpgradeable,
  IBean,
  IBeanstalkUpgradeable,
  IERC20Upgradeable,
  PodsOracleUpgradeable,
  PriceOracleUpgradeable,
  TrancheBondUpgradeable,
  WaterTowerUpgradeable,
  WaterUpgradeable,
} from '../../typechain-types';
import { AuctionType } from '../types';
import { getBean, getBeanMetapool, getBeanstalk, getMockPlots, getUsdc } from '../utils/mint';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { skipTime } from '../utils/time';
import { BigNumber, utils } from 'ethers';
import { expectWithTolerance } from '../utils';
import { AuctionSetting } from '../utils/interface';

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
    let tester: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;
    let trancheBond: TrancheBondUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    let water: WaterUpgradeable;
    let priceOracle: PriceOracleUpgradeable;

    let podsGroup: any;
    let bean: IBean;
    let beanstalk: IBeanstalkUpgradeable;
    let trancheCollection: ERC1155WhitelistUpgradeable;
    let defaultAuctionSetting: AuctionSetting;

    let podsOracle: PodsOracleUpgradeable;

    before(async () => {
      rootAddress = irrigationDiamond.address;
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      tester = signers[2];
      // get stable tokens
      dai = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.DAI);
      usdt = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.USDT);

      sender = signers[1];
      usdc = await getUsdc();
      // our facets
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', rootAddress);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', rootAddress);
      priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
      trancheCollection = await ethers.getContractAt('ERC1155WhitelistUpgradeable', rootAddress);
      water = await ethers.getContractAt('WaterUpgradeable', rootAddress);
      podsOracle = await ethers.getContractAt('PodsOracleUpgradeable', rootAddress);

      // beanstalk
      bean = await getBean();
      beanstalk = await getBeanstalk();

      defaultAuctionSetting = {
        startTime: 0,
        endTime: 0, // duration mode
        sellToken: rootAddress,
        trancheIndex: toWei(0),
        sellAmount: toWei(100),
        minBidAmount: toWei(0.0001),
        fixedPrice: toWei(0.6),
        priceRangeStart: toWei(0.1),
        priceRangeEnd: toWei(0.5),
        reserve: toWei(0),
        incrementBidPrice: toWei(0.0001),
        bidTokenGroupId: 0,
        maxWinners: 5,
        auctionType: AuctionType.TimedAndFixed,
        periodId: 1,
      };

      // hold water
      await water.transfer(sender.address, toWei(50));
      await water.connect(sender).approve(water.address, toWei(50));
      await waterTower.connect(sender).deposit(toWei(50), false);
      await water.transfer(tester.address, toWei(50));
      await water.connect(tester).approve(water.address, toWei(50));
      await waterTower.connect(tester).deposit(toWei(50), false);
    });

    describe('#create tranche', async function () {
      it('creating tranche should be failed without locking more than 32 WATER on water tower', async () => {
        const userInfo = await waterTower.userInfo(owner.address);
        await waterTower.withdraw(userInfo.amount);
        await expect(trancheBond.createTranchesWithPods([500, 200], [0, 0], [20, 20], 0)).revertedWithCustomError(trancheBond, 'NotEligible');
      });

      it('should fail creating tranche with not sorted plots', async () => {
        /// deposit water to use farmer's market
        await water.approve(waterTower.address, toWei(32));
        await waterTower.deposit(toWei(32), false);
        /// approve pods
        await beanstalk.approvePods(trancheBond.address, ethers.constants.MaxUint256);
        /// get mock plots with old plots data
        await getMockPlots();
        await expect(trancheBond.createTranchesWithPods(
          ['747381568584998', 200],
          [0, 0],
          [20, 20],
          0)).revertedWithCustomError(trancheBond, 'NotSortedPlots');
      });

      it('should mint tranche nft when creating tranche', async () => {
        /// buy beans and pods and assign
        const beanMetaPool = await getBeanMetapool();
        await usdc.approve(beanMetaPool.address, ethers.constants.MaxUint256);
        await beanMetaPool.exchange_underlying('2', '0', toD6(1000), '0');
        await bean.approve(beanstalk.address, ethers.constants.MaxUint256);
        let podIndex = await beanstalk.podIndex();
        await beanstalk.sow(toD6(30), 0, 0);
        let podsAmount = await beanstalk.plot(owner.address, podIndex);
        podsGroup = { indexes: [podIndex], amounts: [podsAmount] };
        // console.log('---first:', fromD6(podIndex), fromD6(podsAmount));
        podIndex = await beanstalk.podIndex();
        await beanstalk.sow(toD6(40), 0, 0);
        // await beanstalk.transferPlot(owner.address, sender.address, notDepositedPodIndex, 0, "65039999");
        // console.log(await beanstalk.plot(sender.address, notDepositedPodIndex));
        // simulate separate podlines
        podIndex = await beanstalk.podIndex();
        await beanstalk.sow(toD6(140), 0, 0);
        podsAmount = await beanstalk.plot(owner.address, podIndex);
        podsGroup.indexes.push(podIndex);
        podsGroup.amounts.push(podsAmount);
        // console.log('---second:', fromD6(podIndex), fromD6(podsAmount));        
        await trancheBond.createTranchesWithPods(
          podsGroup.indexes,
          podsGroup.indexes.map(e => 0),
          podsGroup.amounts,
          0);

        const trancheId = 5;
        let tokenBalance = await trancheCollection.balanceOf(owner.address, trancheId);
        // check proxy name for our contract
        expect(utils.parseBytes32String(await trancheCollection.getProxyInfo(rootAddress))).to.be.eq('Irrigation');
        expect(await trancheCollection.uri(trancheId)).to.be.eq(`${process.env.TRANCHE_NFT_METADATA_BASE_URL || 'http://localhost/'}${trancheId}`);
        const { tranche, depositPods, underlyingAsset } = await trancheBond.getTranchePods(trancheId);
        assert(fromWei(tokenBalance) > 0, `tranche nft balance is ${tokenBalance}`);
        const expectedBalance = underlyingAsset.totalFMV.mul(20).div(100);
        expect(tranche.fmv).to.be.eq(expectedBalance);
        assert(
          fromWei(tokenBalance) === fromWei(expectedBalance),
          `expected balance is ${fromWei(expectedBalance)}, but ${fromWei(tokenBalance)} `,
        );
      });

      it('total supply of tranche nft should be same amount as owner tranche nft balance', async () => {
        let trancheId = 5;
        let trNftBalance = await trancheCollection.balanceOf(owner.address, trancheId);
        let trTotalSupply = await trancheCollection.totalSupply(trancheId);
        expect(trNftBalance).to.be.eq(trTotalSupply);
        trancheId = 6;
        const { tranche, underlyingAsset, depositPods } = await trancheBond.getTranchePods(trancheId);
        expect(tranche.fmv).to.be.eq(await trancheCollection.balanceOf(owner.address, trancheId));
        expect(tranche.fmv).to.be.eq(underlyingAsset.totalFMV.mul(30).div(100));
      });

      it('not eligible user should fail creating tranche with pods', async () => {
        await expect(trancheBond.connect(signers[3]).createTranchesWithPods(podsGroup.indexes, [0, 0], podsGroup.amounts, 0)).to.be.revertedWithCustomError(trancheBond, 'NotEligible');
      });

      it('should divide plots by FMV', async () => {
        let trancheId = 5;
        let { depositPods, tranche, underlyingAsset } = await trancheBond.getTranchePods(trancheId);
        const { starts, podAmounts } = await trancheBond.getPlotsForTranche(trancheId);
        trancheId = 6;
        const { starts: startsB, podAmounts: podsB } = await trancheBond.getPlotsForTranche(trancheId);
        trancheId = 7;
        const { starts: startsZ, podAmounts: podsZ } = await trancheBond.getPlotsForTranche(trancheId);
        let sumOfFMVForTrancheA = toD6(0), sumB = toD6(0), sumZ = toD6(0);
        for (let i = 0; i < starts.length; i++) {
          // total sum of amounts of splitted plots is same as orignal amount of not splited plot                    
          expectWithTolerance(podAmounts[i].add(podsB[i]).add(podsZ[i]), depositPods.amounts[i]);
          // after splitting plot, they should not overlap.
          if (podsB[i].gt(0)) expect(podAmounts[i]).lte(startsB[i]);
          if (podsZ[i].gt(0)) expect(podsB[i]).lte(startsZ[i]);
          if (podAmounts[i].gt(0))
            sumOfFMVForTrancheA = sumOfFMVForTrancheA.add(podAmounts[i].mul(depositPods.fmvs[i]).div(depositPods.amounts[i]));
          if (podsB[i].gt(0))
            sumB = sumB.add(podsB[i].mul(depositPods.fmvs[i]).div(depositPods.amounts[i]));
          if (podsZ[i].gt(0))
            sumZ = sumZ.add(podsZ[i].mul(depositPods.fmvs[i]).div(depositPods.amounts[i]));
        }
        expectWithTolerance(sumOfFMVForTrancheA, underlyingAsset.totalFMV.mul(20).div(100));
        expectWithTolerance(sumB, underlyingAsset.totalFMV.mul(30).div(100));
        expectWithTolerance(sumZ, underlyingAsset.totalFMV.mul(50).div(100));
      });
    });

    describe('#tranche nft', async function () {
      it('minting tranche nft by user should be failed', async () => {
        const erc1155 = await ethers.getContractAt('ERC1155WhitelistUpgradeable', rootAddress);
        await expect(erc1155.mint(owner.address, 0, toWei(1000), '0x')).revertedWithCustomError(erc1155, 'NoUserMint');
      });
      it('Test transfer tranche nft', async () => {
        const trancheId = 5;
        const trNftBalance = await trancheCollection.balanceOf(
          owner.address,
          trancheId
        );
        // transfer 50% of total balance
        await trancheCollection.safeTransferFrom(
          owner.address,
          sender.address,
          trancheId,
          trNftBalance.div(2),
          "0x"
        );
        // console.log('----nft balance', trNftBalance.div(2), trNftBalance);
        const senderTrNftBalance = await trancheCollection.balanceOf(sender.address, trancheId);
        assert(
          trNftBalance.div(2).eq(senderTrNftBalance),
          `expected balance after transfer, ${fromWei(trNftBalance)} but ${fromWei(
            senderTrNftBalance,
          )}`,
        );
      });
    });

    describe('#tranche auction', async function () {
      it('Test Tranche Auction for z tranche should be failed ', async () => {
        const trancheId = 7;
        const trNftBalance = await trancheCollection.balanceOf(owner.address, trancheId);
        await expect(
          auctionContract.createAuction({
            ...defaultAuctionSetting,
            sellAmount: trNftBalance,
            minBidAmount: trNftBalance.div(10),
            trancheIndex: trancheId
          }, 1,
            { value: toWei(0.01) }
          ),
        ).to.be.revertedWithCustomError(auctionContract, 'NoListTrancheZ');
      });

      it('Test Tranche Auction create', async () => {
        let trancheId = 6;
        let trNftBalance = await trancheCollection.balanceOf(owner.address, trancheId);
        await trancheCollection.setApprovalForAll(trancheCollection.address, true);
        let updateOwnerBalance = await ethers.provider.getBalance(owner.address);
        let updateContractBalance = await ethers.provider.getBalance(rootAddress);
        const tx = await auctionContract.createAuction({
          ...defaultAuctionSetting,
          sellAmount: trNftBalance,
          minBidAmount: trNftBalance.div(10),
          trancheIndex: trancheId,
        },
          1,
          { value: toWei(0.02) }
        );
        let txReceipt = await tx.wait();
        const totalGas = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);
        updateOwnerBalance = updateOwnerBalance.sub(await ethers.provider.getBalance(owner.address)).sub(totalGas);
        updateContractBalance = (await ethers.provider.getBalance(rootAddress)).sub(updateContractBalance);
        // console.log(updateContractBalance);
        const expectedFeeAmount = trNftBalance.mul(toWei(10 ** 12)).div(await priceOracle.getUnderlyingPriceETH()).mul(15).div(1000);
        expect(updateOwnerBalance).to.be.eq(updateContractBalance);
        expect(updateContractBalance).to.be.eq(expectedFeeAmount);
        expect(await trancheCollection.balanceOf(rootAddress, trancheId)).to.be.equal(
          trNftBalance,
        );
      });

      it('Test Tranche Auction buyNow', async () => {
        const trancheId = 6;
        const lastAuctionId = await auctionContract.getAuctionsCount();
        let auction = await auctionContract.getAuction(lastAuctionId);
        assert(
          auction.s.trancheIndex.eq(trancheId),
          `expected trancheIndex ${trancheId} but ${auction.s.trancheIndex}`,
        );
        // assert(auction.assetType == 1, `expected assetType Tranche but ${auction.assetType}`);
        await dai.transfer(sender.address, toWei(50));
        await dai.connect(sender).approve(auctionContract.address, toWei(50));
        const trNftBalance = await trancheCollection.balanceOf(rootAddress, trancheId);
        await auctionContract.connect(sender).buyNow(lastAuctionId, trNftBalance, 0);
        const senderBalance = await trancheCollection.balanceOf(sender.address, trancheId);
        assert(
          senderBalance.eq(trNftBalance),
          `expected tranche nft balance is ${fromWei(trNftBalance)} but ${fromWei(senderBalance)}`,
        );
        auction = await auctionContract.getAuction(lastAuctionId);
        assert(auction.s.reserve.eq(0), `expected reserve amount is 0 but ${fromWei(auction.s.reserve)}`);
      });

      it('Test Tranche Auction bid', async () => {
        const seller = sender;
        const bidder = owner;
        const trancheId = 6;
        let trNftBalance = await trancheCollection.balanceOf(
          seller.address,
          trancheId
        );
        await skipTime(86400 * 4 + 3600);
        let updateTotalRewards = await waterTower.getTotalRewards();
        let updateEther = await ethers.provider.getBalance(rootAddress);
        await trancheCollection.connect(sender).setApprovalForAll(auctionContract.address, true);
        const tx = await expect(auctionContract
          .connect(seller)
          .createAuction({
            ...defaultAuctionSetting,
            sellAmount: trNftBalance,
            minBidAmount: trNftBalance.div(10),
            trancheIndex: trancheId
          }, 1,
          )).to.be.revertedWithCustomError(auctionContract, 'InsufficientFee');
        const auctionFee = trNftBalance.mul(toWei(10 ** 12)).div(await priceOracle.getUnderlyingPriceETH()).mul(15).div(1000);
        await auctionContract
          .connect(seller)
          .createAuction({
            ...defaultAuctionSetting,
            sellAmount: trNftBalance,
            minBidAmount: trNftBalance.div(10),
            trancheIndex: trancheId,
          },
            1,
            { value: auctionFee }
          );
        // updateTotalRewards = (await waterTower.getTotalRewards()).sub(updateTotalRewards);
        updateEther = (await (ethers.provider.getBalance(rootAddress))).sub(updateEther);
        // expect(updateTotalRewards).to.be.eq(updateEther);
        const lastAuctionId = await auctionContract.getAuctionsCount();
        let auction = await auctionContract.getAuction(lastAuctionId);
        assert(
          auction.s.trancheIndex.eq(trancheId),
          `expected trancheIndex ${trancheId} but ${auction.s.trancheIndex}`,
        );

        await dai.connect(bidder).approve(auctionContract.address, toWei(50));
        let daiBalance = await dai.balanceOf(owner.address);
        trNftBalance = await trancheCollection.balanceOf(rootAddress, trancheId);
        await auctionContract
          .connect(owner)
          .placeBid(lastAuctionId, trNftBalance, 0, toWei(2), false);
        const daiBalanceAfteBidding = await dai.balanceOf(owner.address);
        expect(daiBalanceAfteBidding).to.be.eq(daiBalance.sub(trNftBalance.mul(2).mul(toD6(10 ** 6))));
      });

      it('Test Tranche Auction close', async () => {
        await skipTime(86400 * 6 + 3601);
        const trancheIndex = 6;
        const seller = sender;
        const bidder = owner;
        const auctionId = await auctionContract.getAuctionsCount();
        let bidderBalance = await trancheCollection.balanceOf(bidder.address, trancheIndex);
        assert(bidderBalance.eq(0), `expected tranche nft is 0, but ${bidderBalance}`);
        await auctionContract.connect(seller).closeAuction(auctionId);
        const auction = await auctionContract.getAuction(auctionId);
        bidderBalance = await trancheCollection.balanceOf(bidder.address, trancheIndex);
        assert(
          bidderBalance.gt(0) && bidderBalance.eq(auction.s.sellAmount),
          `expected sell amount ${auction.s.sellAmount}, but ${bidderBalance}`,
        );
      });
    });

    describe('#receive pods with matured tranche', async function () {

      it('deposited pods amount should be same as original amount before transfer pods', async () => {
        const pods0 = await beanstalk.plot(trancheBond.address, podsGroup.indexes[0]);
        expect(pods0).to.be.eq(podsGroup.amounts[0]);
        const pods1 = await beanstalk.plot(trancheBond.address, podsGroup.indexes[1]);
        expect(pods1).to.be.eq(podsGroup.amounts[1]);
      });

      it('should be able to receive pods as many as user nft balance for tranche A', async () => {
        const trancheId = 5;
        const { depositPods, underlyingAsset, tranche } = await trancheBond.getTranchePods(trancheId);
        const { starts, podAmounts } = await trancheBond.getPlotsForUser(trancheId, sender.address);
        expect(starts[0]).to.be.eq(0); expect(starts[1]).to.be.eq(0);
        const balance = await trancheCollection.balanceOf(sender.address, trancheId);
        expectWithTolerance(podAmounts[0].mul(depositPods.fmvs[0]).div(depositPods.amounts[0]), balance);
      });

      it('should be able to receive pods correct for tranche B', async () => {
        const { depositPods, underlyingAsset } = await trancheBond.getTranchePods(6);
        const { starts, podAmounts } = await trancheBond.getPlotsForUser(6, owner.address);
        expect(starts[1]).to.be.eq(0);
        const balance = await trancheCollection.balanceOf(owner.address, 6);
        let expectedFMV = toD6(0);
        for (let i = 0; i < starts.length; i++) {
          expectedFMV = expectedFMV.add(podAmounts[i].mul(depositPods.fmvs[i]).div(depositPods.amounts[i]));
        }
        expectWithTolerance(expectedFMV, balance);
      });

      it('should revert with not mature error before maturity period is over ', async () => {
        await expect(trancheBond.receivePodsForTranche(5)).to.be.revertedWithCustomError(trancheBond, 'NotMatureTranche');
        await expect(trancheBond.receivePodsForTranche(6)).to.be.revertedWithCustomError(trancheBond, 'NotMatureTranche');
        await expect(trancheBond.receivePodsForTranche(7)).to.be.revertedWithCustomError(trancheBond, 'NotMatureTranche');
      });

      it('should revert with insuffifient pods error when user tranche balance is 0 or too small, so calculated pods is 0', async () => {
        await skipTime(86400 * 180);
        expect(await trancheCollection.balanceOf(sender.address, 7)).to.be.eq(0);
        await expect(trancheBond.connect(sender).receivePodsForTranche(7)).to.be.revertedWithCustomError(trancheBond, 'InsufficientPods');
      });

      it('should receive pods after the tranche A is mature', async () => {
        const trancheId = 5;
        let { tranche, depositPods, underlyingAsset } = await trancheBond.getTranchePods(5);
        const oldPods = await beanstalk.plot(trancheBond.address, depositPods.podIndexes[0])
        const tx = await trancheBond.connect(sender).receivePodsForTranche(5);
        const pods0 = await beanstalk.plot(sender.address, depositPods.podIndexes[0])
        const pods1 = await beanstalk.plot(sender.address, depositPods.podIndexes[1])
        const expectedReceivePods = (await trancheBond.getPlotsForTranche(trancheId)).podAmounts[0].div(2);

        depositPods = (await trancheBond.getTranchePods(5)).depositPods;
        // expect(pods0.add(pods1)).to.be.eq(expectedReceivePods);
        expectWithTolerance(pods0.add(pods1), expectedReceivePods);
        if (expectedReceivePods.gt(oldPods)) {
          expect(depositPods.startIndexAndOffsets[0]).to.be.eq(1);
          expect(depositPods.startIndexAndOffsets[3]).to.be.eq(expectedReceivePods.sub(pods0));
        }
        else {
          expect(depositPods.startIndexAndOffsets[0]).to.be.eq(0);
          expect(depositPods.startIndexAndOffsets[3]).to.be.eq(pods0);
        }
      });

      it('should receive pods after the tranche B is mature', async () => {
        const trancheId = 6;
        let { tranche, underlyingAsset, depositPods } = await trancheBond.getTranchePods(trancheId);
        const tx = await trancheBond.receivePodsForTranche(trancheId);
        const plotsForTranche = await trancheBond.getPlotsForTranche(trancheId);
        const expectedReceivePods = plotsForTranche.podAmounts;
        const pods1 = await beanstalk.plot(owner.address, depositPods.podIndexes[0].add(plotsForTranche.starts[0]));
        const pods2 = await beanstalk.plot(owner.address, depositPods.podIndexes[1]);
        expect(pods1.add(pods2)).to.be.eq(expectedReceivePods[0].add(expectedReceivePods[1]));
      });

      it('should receive pods after the tranche Z is mature', async () => {
        const trancheId = 7;
        let { tranche, underlyingAsset, depositPods } = await trancheBond.getTranchePods(trancheId);
        const tx = await trancheBond.receivePodsForTranche(trancheId);
        const plotsForTranche = await trancheBond.getPlotsForTranche(trancheId);
        const expectedReceivePods = plotsForTranche.podAmounts;
        const pods0 = await beanstalk.plot(owner.address, depositPods.podIndexes[0].add(plotsForTranche.starts[0]));
        const pods1 = await beanstalk.plot(owner.address, depositPods.podIndexes[1].add(plotsForTranche.starts[1]));
        expect(pods0.add(pods1)).to.be.eq(expectedReceivePods[0].add(expectedReceivePods[1]));
      });

      it('should receive pods with rest tranche A nft', async () => {
        const trancheId = 5;
        let { tranche, underlyingAsset, depositPods } = await trancheBond.getTranchePods(trancheId);
        const tx = await trancheBond.receivePodsForTranche(trancheId);
        const plotsForTranche = await trancheBond.getPlotsForTranche(trancheId);
        const expectedReceivePods = plotsForTranche.podAmounts;
        const pods = await beanstalk.plot(owner.address, depositPods.podIndexes[0].add(depositPods.startIndexAndOffsets[3]));
        // expect(pods).to.be.eq(expectedReceivePods[0].div(2));
        expectWithTolerance(expectedReceivePods[0].div(2), pods);
      });
    });

    describe('#tranches with old plots', async function () {

      it('create tranches and receive pods with 2 plots', async () => {
        const testPlots = [
          { index: BigNumber.from("345456176278838"), pods: BigNumber.from("7622833600000") },
          { index: BigNumber.from("672857205023752"), pods: BigNumber.from("10622053659968") },
        ];
        let holdPlots = [
          { index: BigNumber.from("353078009878838"), pods: toD6(1000) },
          { index: BigNumber.from("683478258683720"), pods: toD6(1000) },
        ]
        const pods0 = await beanstalk.plot(owner.address, testPlots[0].index);
        expect(pods0).to.be.eq(testPlots[0].pods);
        // harvestable index 57799313214613 podIndex 870004746667651
        // transfer 1000 pods
        await beanstalk.transferPlot(owner.address, tester.address, testPlots[0].index, testPlots[0].pods.sub(toD6(1000)), testPlots[0].pods);
        expect(await beanstalk.plot(tester.address, holdPlots[0].index)).to.be.eq(holdPlots[0].pods);
        await beanstalk.transferPlot(owner.address, tester.address, testPlots[1].index, testPlots[1].pods.sub(toD6(1000)), testPlots[1].pods);
        expect(await beanstalk.plot(tester.address, holdPlots[1].index)).to.be.eq(holdPlots[1].pods);
        await beanstalk.connect(tester).approvePods(trancheBond.address, toD6(2000));
        await trancheBond.connect(tester).createTranchesWithPods(holdPlots.map(e => e.index), holdPlots.map(e => 0), holdPlots.map(e => e.pods), 0);
        const { starts } = await trancheBond.getPlotsForTranche(11);
        await skipTime(180 * 86400);
        await trancheCollection.connect(tester).setApprovalForAll(trancheBond.address, true);
        await trancheBond.connect(tester).receivePodsForTranche(11);
        await trancheBond.connect(tester).receivePodsForTranche(9);
        await trancheBond.connect(tester).receivePodsForTranche(10);
        const pods1 = await beanstalk.plot(tester.address, holdPlots[0].index);
        const pods2 = await beanstalk.plot(tester.address, holdPlots[0].index.add(pods1));
        const pods3 = await beanstalk.plot(tester.address, holdPlots[0].index.add(starts[0]));
        expect(pods1.add(pods2).add(pods3)).to.be.eq(toD6(999.999996));
        expect(await beanstalk.plot(tester.address, holdPlots[1].index)).to.be.eq(toD6(1000));
      });

      it('create tranches and receive pods with 3 plots', async () => {
        const testPlots = [
          { index: BigNumber.from("345456176278838"), pods: BigNumber.from("7621833600000") },
          { index: BigNumber.from("548233773854003"), pods: BigNumber.from("8118000000000") },
          { index: BigNumber.from("672857205023752"), pods: BigNumber.from("10612053659968") },
        ];
        let holdPlots = [
          { index: BigNumber.from("353077009878838"), pods: toD6(1000) },
          { index: BigNumber.from("556350773854003"), pods: toD6(1000) },
          { index: BigNumber.from("683468258683720"), pods: toD6(1000) },
        ]
        const pods0 = await beanstalk.plot(owner.address, testPlots[0].index);
        expect(pods0).to.be.eq(testPlots[0].pods);
        // harvestable index 57799313214613 podIndex 870004746667651
        // transfer 1000 pods
        await beanstalk.transferPlot(owner.address, tester.address, testPlots[0].index, testPlots[0].pods.sub(toD6(1000)), testPlots[0].pods);
        expect(await beanstalk.plot(tester.address, holdPlots[0].index)).to.be.eq(holdPlots[0].pods);
        await beanstalk.transferPlot(owner.address, tester.address, testPlots[1].index, testPlots[1].pods.sub(toD6(1000)), testPlots[1].pods);
        expect(await beanstalk.plot(tester.address, holdPlots[1].index)).to.be.eq(holdPlots[1].pods);
        await beanstalk.transferPlot(owner.address, tester.address, testPlots[2].index, testPlots[2].pods.sub(toD6(1000)), testPlots[2].pods);
        expect(await beanstalk.plot(tester.address, holdPlots[2].index)).to.be.eq(holdPlots[2].pods);
        await beanstalk.connect(tester).approvePods(trancheBond.address, toD6(3000));
        const tx = await trancheBond.connect(tester).createTranchesWithPods(holdPlots.map(e => e.index), holdPlots.map(e => 0), holdPlots.map(e => e.pods), 0);
        await tx.wait(1);
        expect(await beanstalk.plot(trancheBond.address, holdPlots[0].index)).to.be.eq(toD6(1000));
        expect(await beanstalk.plot(trancheBond.address, holdPlots[1].index)).to.be.eq(toD6(1000));
        expect(await beanstalk.plot(trancheBond.address, holdPlots[2].index)).to.be.eq(toD6(1000));
        const { starts } = await trancheBond.getPlotsForTranche(15);
        await skipTime(180 * 86400);
        await trancheCollection.connect(tester).setApprovalForAll(trancheBond.address, true);
        await trancheBond.connect(tester).receivePodsForTranche(14);
        await trancheBond.connect(tester).receivePodsForTranche(15);
        await trancheBond.connect(tester).receivePodsForTranche(13);
        const pods1 = await beanstalk.plot(tester.address, holdPlots[0].index);
        const pods2 = await beanstalk.plot(tester.address, holdPlots[0].index.add(pods1));
        const pods3 = await beanstalk.plot(tester.address, holdPlots[0].index.add(starts[0]));
        expect(pods1.add(pods2).add(pods3)).to.be.eq(toD6(999.999996));
        expect(await beanstalk.plot(tester.address, holdPlots[1].index)).to.be.eq(toD6(1000));
        expect(await beanstalk.plot(tester.address, holdPlots[2].index)).to.be.eq(toD6(999.999995));
      });

    });

  });
}
