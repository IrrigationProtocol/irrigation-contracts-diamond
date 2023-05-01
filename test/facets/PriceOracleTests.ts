import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { PriceOracleUpgradeable } from '../../typechain-types';

export function suite() {
  describe('Irrigation PriceOracle Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let priceOracle: PriceOracleUpgradeable;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', irrigationDiamond.address);
    });

    it('Testing ETH Price', async () => {
      await priceOracle.setChainlinkFeed(CONTRACT_ADDRESSES.ETHER, CONTRACT_ADDRESSES.CHAINLINK_ORACLE_ETH);
      const etherPrice = await priceOracle.getUnderlyingPriceETH();
      expect(fromWei(etherPrice)).to.be.lt(10000);
      expect(fromWei(etherPrice)).to.be.gt(1000);
    });
    
  });
}
