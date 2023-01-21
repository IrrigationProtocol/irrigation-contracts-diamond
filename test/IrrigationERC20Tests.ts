import { expect } from 'chai';
import { ethers } from 'hardhat';
import { utils } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { WaterUpgradeable } from '../typechain-types';

describe('WaterUpgradeable default constructor', () => {
  let owner: SignerWithAddress;
  let waterToken: WaterUpgradeable;

  const TOTAL_SUPPLY = utils.parseEther('100000000');
  const NAME = 'Water Token';
  const SYMBOL = 'WATER';

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const WaterFactory = await ethers.getContractFactory('WaterUpgradeable');
    waterToken = <WaterUpgradeable>await WaterFactory.deploy();
  });

  describe('constructor', () => {
    it('check inital values', async () => {
      expect(await waterToken.totalSupply()).to.be.equal(TOTAL_SUPPLY);
      expect(await waterToken.name()).to.be.equal(NAME);
      expect(await waterToken.symbol()).to.be.equal(SYMBOL);
      expect(await waterToken.balanceOf(owner.address)).to.be.equal(
        TOTAL_SUPPLY,
      );
    });
  });
});
