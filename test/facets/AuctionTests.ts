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
} from '../../scripts/common';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { AuctionUpgradeable, MockERC20Upgradeable } from '../../typechain-types';
import { AuctionType } from '../types';
import { MockERC20D6Upgradeable } from '../../typechain-types/contracts/mock/MockERC20D6Upgradeable';
import { BigNumber } from 'ethers';

export function suite() {
  describe('Irrigation Auction Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
    let usdc: MockERC20D6Upgradeable;
    let usdt: MockERC20D6Upgradeable;
    let water: MockERC20Upgradeable;
    let root: MockERC20Upgradeable;
    let liquidPods: MockERC20Upgradeable;
    let ohmBonds: MockERC20Upgradeable;
    let sender: SignerWithAddress;
    let secondBidder: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;
    let fundAddress: string;

    before(async () => {
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
      usdc = await mockTokenD6Contract.deploy();
      await usdc.Token_Initialize('USDC', 'USDC Stable', toD6(100_000_000));
      usdt = await mockTokenContract.deploy();
      await usdt.Token_Initialize('USDT Stable', 'USDT', toWei(100_000_000));

      // sends tokens to UI work account
      fundAddress = process.env.ADDRESS_TO_FUND;
      if (fundAddress) {
        await usdc.transfer(fundAddress, toD6(1000));
        expect(await usdc.balanceOf(fundAddress)).to.be.equal(toD6(1000));
      }

      sender = signers[1];
      secondBidder = signers[2];
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      await auctionContract.setPurchaseToken(dai.address, true);
      await auctionContract.setPurchaseToken(usdc.address, true);
      expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
      // 1.5% auction fee
      await auctionContract.setAuctionFee(15, signers[2].address);
      expect((await auctionContract.getAuctionFee()).numerator).to.be.eq(BigNumber.from(15));
    });

    it('Testing Auction create', async () => {
      const params = [
        86400 * 2,
        token1.address,
        toWei(100),
        toWei(10),
        toWei(0.9574),
        toWei(0.1),
        toWei(0.5),
        AuctionType.TimedAndFixed,
      ];
      await token1.approve(auctionContract.address, toWei(1000));
      await networkHelpers.time.setNextBlockTimestamp(Math.floor(Date.now() / 1000) + 3600);
      const tx = await auctionContract.createAuction(
        0,
        86400 * 2,
        token1.address,
        toWei(100),
        toWei(10),
        toWei(0.9574),
        toWei(0.1),
        toWei(0.5),
        AuctionType.TimedAndFixed,
      );
      expect(tx)
        .to.emit(auctionContract, 'AuctionCreated')
        .withArgs(owner.address, Math.round(Date.now() / 1000), ...params, 1);
      expect(await token1.balanceOf(auctionContract.address)).to.be.equal(
        toWei(100 + (100 * 15) / 1000),
      );
      const createdAuction = await auctionContract.getAuction(1);
      assert(
        createdAuction.sellToken === token1.address,
        `expected token ${token1.address}, but ${createdAuction.sellToken}`,
      );
      assert(
        createdAuction.seller === owner.address,
        `expected seller ${owner.address}, but ${createdAuction.seller}`,
      );
      assert(
        fromWei(createdAuction.fixedPrice) === '0.9574',
        `expected duration ${0.9574}, but ${createdAuction.fixedPrice}`,
      );
      assert(
        createdAuction.duration.toString() === (86400 * 2).toString(),
        `expected duration ${86400 * 2}, but ${createdAuction.duration}`,
      );
    });
    it('Tesing Auction buyNow', async () => {
      await dai.transfer(sender.address, toWei(50));
      await dai.connect(sender).approve(auctionContract.address, toWei(50));
      await auctionContract.connect(sender).buyNow(1, toWei(40), dai.address);
      let expectedDAIBalance = toWei(50).sub(toWei(40).mul(toWei(0.9574)).div(toWei(1)));
      expect(await dai.balanceOf(sender.address)).to.be.equal(expectedDAIBalance.toString());
      await auctionContract.connect(sender).buyNow(1, toWei(8.155), dai.address);
      expectedDAIBalance = expectedDAIBalance.sub(toWei(8.155).mul(toWei(0.9574)).div(toWei(1)));
      expect(await dai.balanceOf(sender.address)).to.be.equal(expectedDAIBalance.toString());
      expect((await auctionContract.getAuction(1)).reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155).toString(),
      );
      // buy with USDC
      await usdc.transfer(sender.address, toD6(10));
      await usdc.connect(sender).approve(auctionContract.address, toD6(10));
      const buyAmount = 8.151;
      await auctionContract.connect(sender).buyNow(1, toWei(buyAmount), usdc.address);
      let expectedUSDCBalance = toD6(10).sub(
        mulDivRoundingUp(toWei(buyAmount), toWei(0.9574), toBN(10).pow(18 - 6 + 18)),
      );
      expect((await usdc.balanceOf(sender.address)).toString()).to.be.equal(
        expectedUSDCBalance.toString(),
      );
      // console.log(
      //   Number(
      //     toWei(0.111)
      //       .mul(toWei(0.9574))
      //       .div(toBN(10).pow(18 - 6 + 18))
      //       .mul(toBN(10).pow(12))
      //       .sub(toWei(0.111 * 0.9574)),
      //   ) /
      //     10 ** 18,
      // );
    });

    it('Tesing Auction Bid', async () => {
      await dai.transfer(sender.address, toWei(100));
      await dai.connect(sender).approve(auctionContract.address, toWei(100));
      let expectedDAIBalance = await dai.balanceOf(sender.address);
      await auctionContract.connect(sender).placeBid(1, toWei(19), dai.address, toWei(0.2));
      await auctionContract.connect(sender).placeBid(1, toWei(11), dai.address, toWei(0.205));

      await dai.connect(owner).transfer(secondBidder.address, toWei(100));
      await dai.connect(secondBidder).approve(auctionContract.address, toWei(100));
      await usdc.connect(owner).transfer(secondBidder.address, toD6(100));
      await usdc.connect(secondBidder).approve(auctionContract.address, toD6(100));
      await auctionContract.connect(secondBidder).placeBid(1, toWei(20), dai.address, toWei(0.21));
      await auctionContract
        .connect(secondBidder)
        .placeBid(1, toWei(10), usdc.address, toWei(0.2101));

      expectedDAIBalance = expectedDAIBalance
        .sub(toWei(19).mul(toWei(0.2)).div(toWei(1)))
        .sub(toWei(11).mul(toWei(0.205)).div(toWei(1)));
      expect((await dai.balanceOf(sender.address)).toString()).to.be.equal(
        expectedDAIBalance.toString(),
      );

      expect((await auctionContract.getAuction(1)).reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155 - 8.151).toString(),
      );
      expect((await token1.balanceOf(auctionContract.address)).toString()).to.be.equal(
        toWei(101.5 - 40 - 8.155 - 8.151).toString(),
      );

      // failed bidding
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(30), dai.address, toWei(0.21)),
      ).to.be.revertedWith('low Bid');
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(50), dai.address, toWei(0.21523)),
      ).to.be.revertedWith('too big amount than reverse');
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(9), dai.address, toWei(0.21524)),
      ).to.be.revertedWith('too small bid amount');
      // set the timestamp of the next block but don't mine a new block
      await networkHelpers.time.setNextBlockTimestamp(Math.floor(Date.now() / 1000) + 86400 * 2 + 3601);
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(20), dai.address, toWei(0.21523)),
      ).to.be.revertedWith('auction is inactive');
    });

    it('Test Auction close', async () => {
      await auctionContract.connect(sender).closeAuction(1);
      await expect(auctionContract.connect(sender).closeAuction(1)).to.be.rejectedWith(
        "auction can't be closed",
      );
    });

    it('Test Auction claim canceled bid', async () => {
      const bid = await auctionContract.getBid(1, 1);
      const payAmount = await auctionContract.getPayAmount(
        dai.address,
        bid.bidAmount,
        bid.bidPrice,
        token1.address,
      );
      // bid with dai is only one
      expect(await dai.balanceOf(auctionContract.address)).to.be.equal(payAmount);
      // bids with usdc are all done
      await auctionContract.connect(sender).claimForCanceledBid(1, 1);
      expect(await dai.balanceOf(auctionContract.address)).to.be.equal(0);
      expect(await usdc.balanceOf(auctionContract.address)).to.be.equal(0);
      // console.log(await dai.balanceOf(owner.address));
      await expect(auctionContract.connect(sender).claimForCanceledBid(1, 1)).to.be.rejectedWith(
        'already settled bid',
      );
      await expect(auctionContract.connect(sender).claimForCanceledBid(1, 2)).to.be.rejectedWith(
        'already settled bid',
      );
      await expect(auctionContract.connect(sender).claimForCanceledBid(1, 3)).to.be.rejectedWith(
        'bidder only can claim',
      );
    });
  });
}
