import { ethers } from 'hardhat';
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
import { AuctionUpgradeable, IERC20Upgradeable } from '../../typechain-types';
import { AuctionType } from '../types';
import { BigNumber } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { skipTime } from '../utils/time';
import { AuctionSetting, Bid } from '../utils/interface';

export function suite() {
  describe('Irrigation Auction Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: IERC20Upgradeable;
    let token2: IERC20Upgradeable;
    let dai: IERC20Upgradeable;
    let usdc: IERC20Upgradeable;
    let usdt: IERC20Upgradeable;
    let water: IERC20Upgradeable;
    let root: IERC20Upgradeable;
    let ohmBonds: IERC20Upgradeable;
    let sender: SignerWithAddress;
    let secondBidder: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;
    let fundAddress: string;
    let defaultAuctionSetting: AuctionSetting;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      token1 = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.ROOT);
      token2 = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.SPOT);
      water = await ethers.getContractAt('IERC20Upgradeable', irrigationDiamond.address);
      root = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.ROOT);
      ohmBonds = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.OHM);

      // get stable tokens
      dai = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.DAI);
      usdc = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.USDC);
      usdt = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.USDT);

      sender = signers[1];
      secondBidder = signers[2];
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      // expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
      // 1.5% auction fee
      expect((await auctionContract.getAuctionFee()).numerator).to.be.eq(BigNumber.from(15));

      defaultAuctionSetting = {
        startTime: 0,
        endTime: 86400 * 2, // duration mode
        sellToken: token1.address,
        trancheIndex: toWei(0),
        sellAmount: toWei(100),
        minBidAmount: toWei(0.1),
        fixedPrice: toWei(0.9574),
        priceRangeStart: toWei(0.1),
        priceRangeEnd: toWei(0.5),
        reserve: toWei(0),
        incrementBidPrice: toWei(0.00001),
        bidTokenGroupId: 1,
        maxWinners: 5,
        auctionType: AuctionType.FixedPrice
      };
    });

    it('Testing Auction create', async () => {
      await token1.approve(auctionContract.address, toWei(1000));
      await skipTime(3600);
      const auctionSetting: AuctionSetting = {
        ...defaultAuctionSetting, minBidAmount: toWei(10),
        auctionType: AuctionType.TimedAndFixed,
      }
      const tx = await auctionContract.createAuction(
        auctionSetting);
      expect(tx)
        .to.emit(auctionContract, 'AuctionCreated')
        .withArgs(auctionSetting, owner.address, 1);
      expect(await token1.balanceOf(auctionContract.address)).to.be.equal(
        toWei(100 + (100 * 15) / 1000),
      );
      const createdAuction = await auctionContract.getAuction(1);
      assert(
        createdAuction.s.sellToken === token1.address,
        `expected token ${token1.address}, but ${createdAuction.s.sellToken}`,
      );
      assert(
        createdAuction.seller === owner.address,
        `expected seller ${owner.address}, but ${createdAuction.seller}`,
      );
      assert(
        fromWei(createdAuction.s.fixedPrice) === 0.9574,
        `expected duration ${0.9574}, but ${createdAuction.s.fixedPrice}`,
      );
      assert(
        createdAuction.s.endTime.sub(createdAuction.s.startTime).toString() === (86400 * 2).toString(),
        `expected duration ${86400 * 2}, but ${createdAuction.s.endTime.sub(createdAuction.s.startTime)}`,
      );
    });

    it('Supported bid tokens should be get', async () => {
      const auction = await auctionContract.getAuction(1);
      expect(auction.s.bidTokenGroupId).to.be.eq(1);
      expect((await auctionContract.getBidTokenGroup(1)).bidTokens[0]).to.be.eq(dai.address);
    });

    it('Testing Auction buyNow', async () => {
      const auction = await auctionContract.getAuction(1);
      await dai.transfer(sender.address, toWei(50));
      await dai.connect(sender).approve(auctionContract.address, toWei(50));
      await auctionContract.connect(sender).buyNow(1, toWei(40), 0);
      let expectedDAIBalance = toWei(50).sub(toWei(40).mul(toWei(0.9574)).div(toWei(1)));
      expect(await dai.balanceOf(sender.address)).to.be.equal(expectedDAIBalance.toString());
      await auctionContract.connect(sender).buyNow(1, toWei(8.155), 0);
      expectedDAIBalance = expectedDAIBalance.sub(toWei(8.155).mul(toWei(0.9574)).div(toWei(1)));
      expect(await dai.balanceOf(sender.address)).to.be.equal(expectedDAIBalance.toString());
      expect((await auctionContract.getAuction(1)).s.reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155).toString(),
      );
      // buy with USDC
      await usdc.transfer(sender.address, toD6(10));
      await usdc.connect(sender).approve(auctionContract.address, toD6(10));
      const buyAmount = 8.151;
      await auctionContract.connect(sender).buyNow(1, toWei(buyAmount), 1);
      let expectedUSDCBalance = toD6(10).sub(
        mulDivRoundingUp(toWei(buyAmount), toWei(0.9574), toBN(10).pow(18 - 6 + 18)),
      );
      expect((await usdc.balanceOf(sender.address)).toString()).to.be.equal(
        expectedUSDCBalance.toString(),
      );
    });

    it('Testing Auction Bid', async () => {
      await dai.transfer(sender.address, toWei(100));
      await dai.connect(sender).approve(auctionContract.address, toWei(100));
      let expectedDAIBalance = await dai.balanceOf(sender.address);
      let bid1: Bid = { bidder: sender.address, bidAmount: toWei(19), bidPrice: toWei(0.2), paidAmount: toWei(0), bidTokenId: 0, status: 0 };
      let bid2: Bid = { bidder: sender.address, bidAmount: toWei(19), bidPrice: toWei(0.2), paidAmount: toWei(0), bidTokenId: 0, status: 0 };
      const tx1 = await auctionContract.connect(sender).placeBid(1, toWei(19), 0, toWei(0.2), false);
      expect(tx1).to.emit(auctionContract, 'AuctionBid').withArgs(bid1, 1, 1);
      const tx2 = await auctionContract.connect(sender).placeBid(1, toWei(11), 0, toWei(0.205), false);
      expect(tx2).to.emit(auctionContract, 'AuctionBid').withArgs(bid2, 1, 2);
      await dai.connect(owner).transfer(secondBidder.address, toWei(100));
      await dai.connect(secondBidder).approve(auctionContract.address, toWei(100));
      await usdc.connect(owner).transfer(secondBidder.address, toD6(100));
      await usdc.connect(secondBidder).approve(auctionContract.address, toD6(100));
      await auctionContract.connect(secondBidder).placeBid(1, toWei(20), 0, toWei(0.21), false);
      await auctionContract
        .connect(secondBidder)
        .placeBid(1, toWei(10), 1, toWei(0.2101), false);

      expectedDAIBalance = expectedDAIBalance
        .sub(toWei(19).mul(toWei(0.2)).div(toWei(1)))
        .sub(toWei(11).mul(toWei(0.205)).div(toWei(1)));
      expect((await dai.balanceOf(sender.address)).toString()).to.be.equal(
        expectedDAIBalance.toString(),
      );

      expect((await auctionContract.getAuction(1)).s.reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155 - 8.151).toString(),
      );
      expect((await token1.balanceOf(auctionContract.address)).toString()).to.be.equal(
        toWei(101.5 - 40 - 8.155 - 8.151).toString(),
      );

      // failed bidding
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(30), 0, toWei(0.21), false),
      ).to.be.revertedWithCustomError(auctionContract, 'LowBid');
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(50), 0, toWei(0.21523), false),
      ).to.be.revertedWithCustomError(auctionContract, 'InsufficientReserveAsset');
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(9), 0, toWei(0.21524), false),
      ).to.be.revertedWithCustomError(auctionContract, 'SmallBidAmount');
      await skipTime(86400 * 2 + 3601);
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(20), 0, toWei(0.21523), false),
      ).to.be.revertedWithCustomError(auctionContract, 'InactiveAuction');
    });

    it('Testing Auction close', async () => {
      let auction = await auctionContract.getAuction(1);
      // console.log(fromWei(auction.reserve), fromWei(auction.totalBidAmount), Number(auction.curBidId));
      const reserveAmount = auction.s.reserve;
      // console.log(await auctionContract.getBid(1,1));
      let updatedContractTokenBalance = await token1.balanceOf(auctionContract.address);
      // console.log('contract balance:', fromWei(await token1.balanceOf(auctionContract.address)));
      await auctionContract.connect(sender).closeAuction(1);
      auction = await auctionContract.getAuction(1);
      // console.log(auction.reserve, auction.totalBidAmount);
      // console.log('contract balance', fromWei(await token1.balanceOf(auctionContract.address)));
      // total reserve amount are settled.
      updatedContractTokenBalance = updatedContractTokenBalance.sub(await token1.balanceOf(auctionContract.address));
      expect(updatedContractTokenBalance).to.be.eq(reserveAmount);
      await expect(auctionContract.connect(sender).closeAuction(1)).to.be.rejectedWith(
        "auction can't be closed",
      );
    });

    it('Testing Auction claim canceled bid', async () => {
      // bids with usdc are all canceled      
      expect(await usdc.balanceOf(auctionContract.address)).to.be.equal(0);
    });

    it('Testing Auction with fixed price', async () => {
      await token1.approve(auctionContract.address, toWei(1000));
      let updatedContractTokenBalance = await token1.balanceOf(auctionContract.address);
      const tx = await auctionContract.createAuction({
        ...defaultAuctionSetting,
        minBidAmount: toWei(10),
        fixedPrice: toWei(5),
        priceRangeStart: toWei(2),
        priceRangeEnd: toWei(10),
        incrementBidPrice: toWei(0.001),
      });
      expect(tx).to.emit(auctionContract, 'AuctionCreated');

      expect((await token1.balanceOf(auctionContract.address)).sub(updatedContractTokenBalance)).to.be.equal(
        toWei(100 + (100 * 15) / 1000),
      );
      const createdAuction = await auctionContract.getAuction(2);
      assert(
        createdAuction.s.sellToken === token1.address,
        `expected token ${token1.address}, but ${createdAuction.s.sellToken}`,
      );
      assert(
        createdAuction.seller === owner.address,
        `expected seller ${owner.address}, but ${createdAuction.seller}`,
      );
      assert(
        fromWei(createdAuction.s.fixedPrice) === 5,
        `expected fixedPrice ${5}, but ${fromWei(createdAuction.s.fixedPrice)}`,
      );
      await dai.transfer(sender.address, toWei(50));
      await dai.connect(sender).approve(auctionContract.address, toWei(50));
      await auctionContract.connect(sender).buyNow(2, toWei(1), 0);
    });

    it('Creating Auction with invalid token should be failed', async () => {
      await expect(auctionContract.createAuction({ ...defaultAuctionSetting, sellToken: CONTRACT_ADDRESSES.ETHER })).to.be.revertedWith('Address: call to non-contract');
    });

    it('Tranche Auction with sellToken should be reverted', async () => {
      await expect(auctionContract.createAuction({ ...defaultAuctionSetting, trancheIndex: 1 })).to.be.revertedWithCustomError(auctionContract, 'InvalidTrancheAuction');
    });

    it('Test Auction with max check bids', async () => {
      let tx = await auctionContract.createAuction({ ...defaultAuctionSetting, auctionType: AuctionType.TimedAuction, maxWinners: 255 });
      await dai.transfer(sender.address, toWei(600));
      await dai.connect(sender).approve(auctionContract.address, toWei(600));
      for (let i = 0; i < 500; i++) {
        await auctionContract.connect(sender).placeBid(3, toWei(1), 0, toWei(0.101 + i * 0.001), false);
      }
      let auction = await auctionContract.getAuction(3);
      expect(auction.totalBidAmount).to.be.eq(toWei(100));
      expect(auction.availableBidDepth).to.be.eq(100);
      await auctionContract.connect(sender).placeBid(3, toWei(0.5), 0, toWei(0.65), false);
      auction = await auctionContract.getAuction(3);
      expect(auction.totalBidAmount).to.be.eq(toWei(100.5));
      expect(auction.availableBidDepth).to.be.eq(101);
      await dai.connect(owner).approve(auctionContract.address, toWei(100000));
      // this transction cancels 24 low bids when max gas limit is 500_000
      await auctionContract.connect(owner).placeBid(3, toWei(50),  0, toWei(0.8), false);
      auction = await auctionContract.getAuction(3);
      expect(auction.totalBidAmount).to.be.eq(toWei(126.5));
      expect(auction.availableBidDepth).to.be.eq(77 + 1);
      expect(auction.curBidId).to.be.eq(502);
      const lowestBid = await auctionContract.getBid(3, 502 - 77);
      const highestCancelBid = await auctionContract.getBid(3, 502 - 78);
      expect(lowestBid.status).to.be.eq(0);
      expect(highestCancelBid.status).to.be.eq(3);
      await skipTime(86400 * 2);

      // when closing auction, settles 29 top bids in the case of limit is 500_000
      await expect(auctionContract.claimBid(3, 449)).to.be.revertedWithCustomError(auctionContract, 'NoClosedAuction');
      let updatedDaiContractBalance = await dai.balanceOf(auctionContract.address);
      tx = await auctionContract.closeAuction(3);
      let sum = toWei(0);
      for (let i = 451; i <= 502; i++) {
        const paidDaiAmount = (await auctionContract.getBid(3, i)).paidAmount;
        sum = sum.add(i == 451 ? paidDaiAmount.div(2) : paidDaiAmount);
      }
      expect(updatedDaiContractBalance.sub(await dai.balanceOf(auctionContract.address))).to.be.eq(sum);

      // console.log(auction.maxWinners, auction.reserve);
      let bidId = 502;
      let bid = await auctionContract.getBid(3, bidId);
      while (bid.status != 0) {
        bid = await auctionContract.getBid(3, --bidId);
      }
      const lastSettledBidId = 493;
      expect((await auctionContract.getBid(3, lastSettledBidId)).status).to.be.eq(3);
      expect((await auctionContract.getBid(3, lastSettledBidId - 1)).status).to.be.eq(0);
      expect(bidId).to.be.eq(lastSettledBidId - 1);
      let txReceipt = await tx.wait();
      const totalGas = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);
      debuglog(`max gas for 255 winners: ${fromWei(totalGas)}`);
    });
    it('Not settled winner bids should be able to claim after auction is closed', async () => {
      let auction = await auctionContract.getAuction(3);
      const lastSettledBidId = 493;
      // winner that receives full token amount as same as bid amount      
      const bid480 = await auctionContract.isWinnerBid(3, lastSettledBidId - 1);
      expect(bid480.claimAmount).to.be.eq(toWei(1));
      expect(bid480.isWinner).to.be.eq(true);
      // winner that receives token amount smaller than bid amount
      let bid451 = await auctionContract.isWinnerBid(3, 451);
      expect(bid451.claimAmount).to.be.eq(toWei(0.5));
      expect(bid451.isWinner).to.be.eq(true);
      // not winner
      const bid450 = await auctionContract.isWinnerBid(3, 450);
      expect(bid450.claimAmount).to.be.eq(0);
      expect(bid450.isClaimed).to.be.eq(false);
      expect(bid450.isWinner).to.be.eq(false);
      expect(auction.s.reserve).to.be.eq(toWei(41.5));
      let updatedContractTokenBalance = await token1.balanceOf(auctionContract.address);
      // claim not settled bid with biggest id
      await auctionContract.connect(sender).claimBid(3, lastSettledBidId - 1);
      expect(updatedContractTokenBalance.sub(await token1.balanceOf(auctionContract.address))).to.be.eq(toWei(1));
      auction = await auctionContract.getAuction(3);
      let bid = await auctionContract.getBid(3, 451);
      expect(auction.s.reserve).to.be.eq(toWei(40.5));
      let daiBalance = await dai.balanceOf(auctionContract.address);
      let daiOfOwner = await dai.balanceOf(owner.address);
      let daiOfSender = await dai.balanceOf(sender.address);
      // claim not fullfilled bid
      await auctionContract.connect(sender).claimBid(3, 451);
      expect(updatedContractTokenBalance.sub(await token1.balanceOf(auctionContract.address))).to.be.eq(toWei(1.5));
      expect(daiBalance.sub(await dai.balanceOf(auctionContract.address))).to.be.eq(bid.paidAmount.div(2));
      // expect((await dai.balanceOf(owner.address)).sub(daiOfOwner)).to.be.eq(bid.paidAmount.div(2));
      expect((await dai.balanceOf(sender.address)).sub(daiOfSender)).to.be.eq(bid.paidAmount.div(2));
      auction = await auctionContract.getAuction(3);
      expect(auction.s.reserve).to.be.eq(toWei(40));
      // just claimed bid
      await expect(auctionContract.connect(sender).claimBid(3, 451)).to.be.revertedWithCustomError(auctionContract, 'ClaimedBid');
      // already settled bid when closing auciton
      await expect(auctionContract.connect(sender).claimBid(3, lastSettledBidId + 1)).to.be.revertedWithCustomError(auctionContract, 'ClaimedBid');
      // canceled bid
      daiOfSender = await dai.balanceOf(sender.address);
      await auctionContract.claimBid(3, 450);
      bid = await auctionContract.getBid(3, 450);
      expect((await dai.balanceOf(sender.address)).sub(daiOfSender)).to.be.eq(bid.paidAmount);
    });

    it('update auction before bidding', async () => {
      await expect(auctionContract.updateAuction(5, 0, 0, 0)).to.be.revertedWithCustomError(auctionContract, 'NoAuctioneer');
      await expect(auctionContract.updateAuction(3, 0, 0, 0)).to.be.revertedWithCustomError(auctionContract, 'NoIdleAuction');
      let tx = await auctionContract.createAuction({ ...defaultAuctionSetting, maxWinners: 255, auctionType: AuctionType.TimedAuction });
      await expect(auctionContract.connect(sender).updateAuction(4, 0, 0, 0)).to.be.revertedWithCustomError(auctionContract, 'NoAuctioneer');
      await auctionContract.updateAuction(4, toWei(1.1), 0, 0);
      let updatedAuction = await auctionContract.getAuction(4);
      expect(updatedAuction.s.minBidAmount).to.be.eq(toWei(1.1));
      await auctionContract.connect(secondBidder).placeBid(4, toWei(1.1), 0, 0, false);
      await expect(auctionContract.updateAuction(4, 0, 0, 0)).to.be.revertedWithCustomError(auctionContract, 'NoIdleAuction');
    })
  });
}

