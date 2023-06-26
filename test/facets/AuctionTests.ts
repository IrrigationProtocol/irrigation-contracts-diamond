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
      expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
      // 1.5% auction fee
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
      await skipTime(3600)
      const tx = await auctionContract.createAuction(
        0,
        86400 * 2,
        token1.address,
        0,
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
        fromWei(createdAuction.fixedPrice) === 0.9574,
        `expected duration ${0.9574}, but ${createdAuction.fixedPrice}`,
      );
      assert(
        createdAuction.duration.toString() === (86400 * 2).toString(),
        `expected duration ${86400 * 2}, but ${createdAuction.duration}`,
      );
    });

    it('Testing Auction buyNow', async () => {
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
    });

    it('Testing Auction Bid', async () => {
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
      await skipTime(86400 * 2 + 3601);
      await expect(
        auctionContract.connect(secondBidder).placeBid(1, toWei(20), dai.address, toWei(0.21523)),
      ).to.be.revertedWith('auction is inactive');
    });

    it('Testing Auction close', async () => {
      await auctionContract.connect(sender).closeAuction(1);
      await expect(auctionContract.connect(sender).closeAuction(1)).to.be.rejectedWith(
        "auction can't be closed",
      );
    });

    it('Testing Auction claim canceled bid', async () => {
      const bid = await auctionContract.getBid(1, 1);
      const payAmount = await auctionContract.getPayAmount(
        dai.address,
        bid.bidAmount,
        bid.bidPrice,
        token1.address,
      );
      // bid with dai is only one
      let updatedDaiBalance = await dai.balanceOf(auctionContract.address);
      // bids with usdc are all done
      await auctionContract.connect(sender).claimForCanceledBid(1, 1);
      updatedDaiBalance = updatedDaiBalance.sub(await dai.balanceOf(auctionContract.address));
      expect(updatedDaiBalance).to.be.equal(payAmount);
      expect(await usdc.balanceOf(auctionContract.address)).to.be.equal(0);

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

    it('Testing Auction with fixed price', async () => {
      const params = [
        86400 * 2,
        token1.address,
        toWei(100),
        toWei(10),
        toWei(5),
        toWei(2),
        toWei(10),
        AuctionType.FixedPrice,
      ];
      await token1.approve(auctionContract.address, toWei(1000));
      const tx = await auctionContract.createAuction(
        0,
        86400 * 2,
        token1.address,
        0,
        toWei(100),
        toWei(10),
        toWei(5),
        toWei(2),
        toWei(10),
        AuctionType.FixedPrice,
      );
      expect(tx)
        .to.emit(auctionContract, 'AuctionCreated')
        .withArgs(owner.address, Math.round(Date.now() / 1000), ...params, 2);

      expect(await token1.balanceOf(auctionContract.address)).to.be.equal(
        toWei(100 + (100 * 30) / 1000),
      );
      const createdAuction = await auctionContract.getAuction(2);
      assert(
        createdAuction.sellToken === token1.address,
        `expected token ${token1.address}, but ${createdAuction.sellToken}`,
      );
      assert(
        createdAuction.seller === owner.address,
        `expected seller ${owner.address}, but ${createdAuction.seller}`,
      );
      assert(
        fromWei(createdAuction.fixedPrice) === 5,
        `expected fixedPrice ${5}, but ${fromWei(createdAuction.fixedPrice)}`,
      );
      await dai.transfer(sender.address, toWei(50));
      await dai.connect(sender).approve(auctionContract.address, toWei(50));
      await auctionContract.connect(sender).buyNow(2, toWei(1), dai.address);
    });

    it('Creating Auction with invalid token should be failed', async () => {
      await expect(auctionContract.createAuction(
        0,
        86400 * 2,
        CONTRACT_ADDRESSES.ETHER,
        0,
        toWei(100),
        toWei(10),
        toWei(5),
        toWei(2),
        toWei(10),
        AuctionType.FixedPrice,
      )).to.be.revertedWith('Address: call to non-contract');
    });
  });
}
