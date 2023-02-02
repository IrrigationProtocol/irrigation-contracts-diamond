import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { AuctionUpgradeable, MockERC20Upgradeable } from '../../typechain-types';
import { AuctionType } from '../types';

export function suite() {
  describe('Irrigation Auction Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
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
      sender = signers[1];
      secondBidder = signers[2];      
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      await auctionContract.setPurchaseToken(dai.address, true);
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
    });

    it('Tesing Auction Bid', async () => {
      await dai.transfer(sender.address, toWei(100));
      await dai.connect(sender).approve(auctionContract.address, toWei(100));
      let expectedDAIBalance = await dai.balanceOf(sender.address);
      await auctionContract.connect(sender).placeBid(1, toWei(30), dai.address, toWei(0.2));

      await dai.transfer(secondBidder.address, toWei(100));
      await dai.connect(secondBidder).approve(auctionContract.address, toWei(100));      
      await auctionContract.connect(secondBidder).placeBid(1, toWei(30), dai.address, toWei(0.21));

      expectedDAIBalance = expectedDAIBalance.sub(toWei(30).mul(toWei(0.2)).div(toWei(1)));
      expect(await dai.balanceOf(sender.address)).to.be.equal(expectedDAIBalance.toString());
      const auction = await auctionContract.getAuction(1);      
      expect((await auctionContract.getAuction(1)).reserve.toString()).to.be.equal(
        toWei(100 - 40 - 8.155).toString(),
      );
      expect((await token1.balanceOf(auctionContract.address)).toString()).to.be.equal(
        toWei(100 - 40 - 8.155).toString(),
      );
    });
  });
}
