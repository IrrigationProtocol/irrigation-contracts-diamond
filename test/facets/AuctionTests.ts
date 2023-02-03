import { ethers } from 'hardhat';
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
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { AuctionUpgradeable, MockERC20Upgradeable } from '../../typechain-types';
import { AuctionType } from '../types';
import { MockERC20D6Upgradeable } from '../../typechain-types/contracts/mock/MockERC20D6Upgradeable';

export function suite() {
  describe('Irrigation Auction Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
    let usdc: MockERC20D6Upgradeable;
    let sender: SignerWithAddress;
    let secondBidder: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;

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
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      await auctionContract.setPurchaseToken(dai.address, true);
      await auctionContract.setPurchaseToken(usdc.address, true);
      expect(await auctionContract.isSupportedPurchaseToken(usdc.address)).to.be.eq(true);
    });

    it('Testing Auction create', async () => {
      const params = [
        86400 * 2,
        token1.address,
        toWei(100),
        toWei(20),
        toWei(0.9574),
        toWei(0.1),
        toWei(0.5),
        AuctionType.TimedAndFixed,
      ];
      await token1.approve(auctionContract.address, toWei(100));
      const tx = await auctionContract.createAuction(
        0,
        86400 * 2,
        token1.address,
        toWei(100),
        toWei(20),
        toWei(0.9574),
        toWei(0.1),
        toWei(0.5),
        AuctionType.TimedAndFixed,
      );
      expect(tx)
        .to.emit(auctionContract, 'AuctionCreated')
        .withArgs(owner.address, Math.round(Date.now() / 1000), ...params, 1);
      expect(await token1.balanceOf(auctionContract.address)).to.be.equal(toWei(100));
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
      await auctionContract.connect(sender).placeBid(1, toWei(30), dai.address, toWei(0.2));

      await dai.connect(owner).transfer(secondBidder.address, toWei(100));
      await dai.connect(secondBidder).approve(auctionContract.address, toWei(100));
      await auctionContract.connect(secondBidder).placeBid(1, toWei(30), dai.address, toWei(0.21));   
      expectedDAIBalance = expectedDAIBalance.sub(toWei(30).mul(toWei(0.2)).div(toWei(1)));
      expect((await dai.balanceOf(sender.address)).toString()).to.be.equal(
        expectedDAIBalance.toString(),
      );

      expect((await auctionContract.getAuction(1)).reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155 - 8.151).toString(),
      );
      expect((await token1.balanceOf(auctionContract.address)).toString()).to.be.equal(
        toWei(100 - 40 - 8.155 - 8.151).toString(),
      );
      
      await expect(auctionContract.connect(secondBidder).placeBid(1, toWei(30), dai.address, toWei(0.21))).to.be.revertedWith('low Bid');
      await expect(auctionContract.connect(secondBidder).placeBid(1, toWei(50), dai.address, toWei(0.21523))).to.be.revertedWith('too big amount than reverse');
      await expect(auctionContract.connect(secondBidder).placeBid(1, toWei(19), dai.address, toWei(0.21523))).to.be.revertedWith('too small bid amount');
    });
  });
}
