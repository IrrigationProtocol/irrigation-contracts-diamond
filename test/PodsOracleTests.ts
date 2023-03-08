import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, toD6, fromD6, fromWei } from '../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PodsOracleUpgradeable } from '../typechain-types';
import { IrrigationDiamond } from '../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { BigNumber } from 'ethers';

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

    it('Testing pods price', async () => {
      // price calculation based on onchain data
      const podPrice = await podsOracle.latestPriceOfPods(toD6(23.68), toD6(9001.46));
      console.log('PODS price:', fromWei(podPrice));
      // test price calculation based on simulate data
      const price = await podsOracle.priceOfPods(
        toD6(23.68),
        toD6(9001.46),
        BigNumber.from('829849243800001'),
        BigNumber.from('57799313214613'),
      );
      assert(
        fromWei(price) >= 0.9693225796 && fromWei(price) <= 0.9693225797,
        `expected price 0.9693225797 but ${fromWei(price)}`,
      );
    });
  });
}
