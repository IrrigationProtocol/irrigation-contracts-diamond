import { ethers } from 'hardhat';
import { dc, toD6, toWei } from '../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from './utils/debug';
import {
  IrrigationControlUpgradeable,
  WaterTowerUpgradeable,
  SprinklerUpgradeable,
  AuctionUpgradeable,
  TrancheBondUpgradeable,
} from '../typechain-types';
import { CONTRACT_ADDRESSES } from '../scripts/shared';
import { getDefaultAuctionSetting } from './facets/AuctionTests';

export function suite() {
  describe('Irrigation Protocol Control Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let rootAddress: string;
    let irrigationControl: IrrigationControlUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    let sprinkler: SprinklerUpgradeable;
    let auction: AuctionUpgradeable;
    let trancheBond: TrancheBondUpgradeable;
    before(async () => {
      rootAddress = dc.IrrigationDiamond.address;
      signers = await ethers.getSigners();
      owner = signers[0];
      irrigationControl = await ethers.getContractAt('IrrigationControlUpgradeable', rootAddress);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', rootAddress);
      sprinkler = await ethers.getContractAt('SprinklerUpgradeable', rootAddress);
      auction = await ethers.getContractAt('AuctionUpgradeable', rootAddress);
      trancheBond = await ethers.getContractAt('TrancheBondUpgradeable', rootAddress);
    });

    it('Transactions should be reverted after paused', async () => {
      await irrigationControl.pause();
      // then transactions should be reverted
      await expect(waterTower.deposit(0, false)).revertedWith('Pausable: paused');
      await expect(waterTower.withdraw(0)).revertedWith('Pausable: paused');
      await expect(waterTower.irrigate(0, 0)).revertedWith('Pausable: paused');
      await expect(waterTower.claim(0)).revertedWith('Pausable: paused');

      await expect(sprinkler.exchangeTokenToWater(CONTRACT_ADDRESSES.BEAN, 0)).revertedWith(
        'Pausable: paused',
      );
      await expect(sprinkler.exchangeETHToWater()).revertedWith('Pausable: paused');

      await expect(auction.createAuction(getDefaultAuctionSetting(), 0)).revertedWith(
        'Pausable: paused',
      );
      await expect(auction.buyNow(0, 0, 0)).revertedWith('Pausable: paused');
      await expect(auction.placeBid(0, 0, 0, 0, 0)).revertedWith('Pausable: paused');
      await expect(auction.claimBid(0, 0)).revertedWith('Pausable: paused');
      await expect(auction.updateAuction(0, 0, 0, 0)).revertedWith('Pausable: paused');
      await expect(auction.closeAuction(0)).revertedWith('Pausable: paused');

      await expect(trancheBond.createTranchesWithPods([0], [0], [0], 0)).revertedWith(
        'Pausable: paused',
      );
      await expect(trancheBond.receivePodsForTranche(0)).revertedWith('Pausable: paused');
      await irrigationControl.unpause();
      await expect(irrigationControl.connect(signers[1]).pause()).revertedWith(
        'Only SuperAdmin allowed',
      );
    });

    it('Auction fee', async () => {
      let feeForlevel0 = await auction.getAuctionFeeAndLimit(0);
      expect(feeForlevel0.listingFee).to.be.eq(toD6(0.025));
      expect(feeForlevel0.successFee).to.be.eq(toD6(0.05));
      expect(feeForlevel0.feeLevel).to.be.eq(0);
      feeForlevel0 = await auction.getAuctionFeeAndLimit(31);
      expect(feeForlevel0.listingFee).to.be.eq(toD6(0.025));
      expect(feeForlevel0.successFee).to.be.eq(toD6(0.05));
      expect(feeForlevel0.feeLevel).to.be.eq(0);
      let feeForlevel1 = await auction.getAuctionFeeAndLimit(toWei(32));
      expect(feeForlevel1.listingFee).to.be.eq(toD6(0.01));
      expect(feeForlevel1.successFee).to.be.eq(toD6(0.015));
      expect(feeForlevel1.feeLevel).to.be.eq(1);
      expect(feeForlevel1.limit).to.be.eq(toWei(32));
      feeForlevel1 = await auction.getAuctionFeeAndLimit(toWei(33));
      expect(feeForlevel1.listingFee).to.be.eq(toD6(0.01));
      expect(feeForlevel1.successFee).to.be.eq(toD6(0.015));
      expect(feeForlevel1.feeLevel).to.be.eq(1);
      expect(feeForlevel1.limit).to.be.eq(toWei(32));
      let feeForlevel = await auction.getAuctionFeeAndLimit(toWei(320));
      expect(feeForlevel.listingFee).to.be.eq(toD6(0.0066));
      expect(feeForlevel.successFee).to.be.eq(toD6(0.01));
      expect(feeForlevel.feeLevel).to.be.eq(2);
      expect(feeForlevel.limit).to.be.eq(toWei(320));
      // top level
      feeForlevel = await auction.getAuctionFeeAndLimit(toWei(3200000));
      expect(feeForlevel.listingFee).to.be.eq(0);
      expect(feeForlevel.successFee).to.be.eq(toD6(0.005));
      expect(feeForlevel.feeLevel).to.be.eq(5);
      expect(feeForlevel.limit).to.be.eq(toWei(320000));
      // initialize auction fee as default 1.5%, 1% for everyone
      await irrigationControl.setAuctionFee({
        limits: [0, toWei(100_000_000)],
        listingFees: [toD6(0.01), 0],
        successFees: [toD6(0.015), 0],
      });
      feeForlevel = await auction.getAuctionFeeAndLimit(toWei(320));      
      expect(feeForlevel.listingFee).to.be.eq(toD6(0.01));
      expect(feeForlevel.successFee).to.be.eq(toD6(0.015));
      expect(feeForlevel.feeLevel).to.be.eq(0);
      expect(feeForlevel.limit).to.be.eq(0);
    });
  });
}
