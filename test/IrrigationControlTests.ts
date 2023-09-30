import { ethers } from 'hardhat';
import { dc, toWei } from '../scripts/common';
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
  describe('Irrigation Pausable Testing', async function () {
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
      await irrigationControl.setAuctionFee({
        limits: [toWei(32)],
        listingFees: [0, 10],
        successFees: [0, 10],
      });
      expect(await auction.getListingFee(toWei(10))).to.be.eq(0);
      expect(await auction.getListingFee(toWei(1000))).to.be.eq(10);
    });
  });
}
