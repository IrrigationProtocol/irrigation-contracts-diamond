import { ethers } from 'hardhat';
import { dc, toWei, toD6, fromWei } from '../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PodsOracleUpgradeable } from '../typechain-types';
import { IrrigationDiamond } from '../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { BigNumber } from 'ethers';
import { getPriceOfPods } from './utils/price';
import { assert, expect } from './utils/debug';

export function suite() {
  describe('Irrigation Pods Oracle Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let podsOracle: PodsOracleUpgradeable;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      podsOracle = await ethers.getContractAt('PodsOracleUpgradeable', irrigationDiamond.address);
    });

    it('Test pods price', async () => {
      // test price calculation based on simulate data
      const price = await podsOracle.priceOfPods(
        BigNumber.from('81479313214613'),
        BigNumber.from('9001460000'),
        BigNumber.from('851463116022336'),
        BigNumber.from('57799313214613'),
      );
      assert(
        fromWei(price) >= 8732.838594 && fromWei(price) <= 8732.838595,
        `expected price 8732.838595 but ${fromWei(price)}`,
      );
      expect(getPriceOfPods(
        BigNumber.from('81479313214613'),
        BigNumber.from('9001460000'),
        BigNumber.from('851463116022336'),
        BigNumber.from('57799313214613'),)).to.be.eq(BigNumber.from("8732838594832155249593"));
    });

    it('pods price for a podline that contains only harvestable pods should be 1 * pods BDV', async () => {
      const price = await podsOracle.priceOfPods(
        toD6(100_000_000),
        toD6(100),
        toD6(300_000_000),
        toD6(200_000_000),
      );
      expect(price).to.be.eq(toWei(100));
      expect(getPriceOfPods(toD6(100_000_000), toD6(100), toD6(300_000_000), toD6(200_000_000))).to.be.eq(toWei(100));
    });

    it('Test pods price for a podline that contains harvestable and unharvestable pods', async () => {
      const price = await podsOracle.priceOfPods(
        toD6(190_000_000),
        toD6(20_000_000),
        toD6(300_000_000),
        toD6(200_000_000),
      );
      // 10M for harvestable part and 9.5M for unharvestable
      expect(price).to.be.eq(toWei(10_000_000 + 9_500_000));
      expect(getPriceOfPods(toD6(190_000_000), toD6(20_000_000), toD6(300_000_000), toD6(200_000_000))).to.be.eq(toWei(10_000_000 + 9_500_000));
    });

  });
}
