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
      expect((await auction.getAuctionFeeAndLimit(0)).listingFee).to.be.eq(toD6(0.025));
      expect((await auction.getAuctionFeeAndLimit(0)).successFee).to.be.eq(toD6(0.05));
      expect((await auction.getAuctionFeeAndLimit(0)).limit).to.be.eq(0);
      
      // listing fee and closing fee is 0 when user stored more than 3200 water
      await irrigationControl.setAuctionFee({
        limits: [toWei(3200)],
        listingFees: [10000, 0],
        successFees: [15000, 0],
      });
      expect((await auction.getAuctionFee(toWei(32))).listingFee).to.be.eq(10000);
      expect((await auction.getAuctionFee(toWei(3200))).listingFee).to.be.eq(0);
      expect((await auction.getAuctionFee(toWei(99_000_000))).listingFee).to.be.eq(0);
      // initialize auction fee as default 1.5%, 1% for everyone
      await irrigationControl.setAuctionFee({
        limits: [toWei(100_000_000)],
        listingFees: [10000],
        successFees: [15000],
      });
    });
  });
}
