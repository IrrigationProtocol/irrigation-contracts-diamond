import { ethers } from 'hardhat';
import { dc, fromWei, INetworkDeployInfo } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { PriceOracleUpgradeable } from '../../typechain-types';
import { expect } from '../utils/debug';

export function suite(networkDeployedInfo: INetworkDeployInfo) {
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

    it('Test ETH Price based on chainlink oracle', async () => {
      const etherPrice = await priceOracle.getUnderlyingPriceETH();
      expect(fromWei(etherPrice)).to.be.lt(10000);
      expect(fromWei(etherPrice)).to.be.gt(1000);
    });

    it('Test Bean Price based on custom oracle', async () => {
      const beanPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.BEAN);
      expect(fromWei(beanPrice)).to.be.lt(1.2);
      expect(fromWei(beanPrice)).to.be.gt(0.9);
    });

    it('Test SPOT Price based on uniswapv3 oracle', async () => {
      const spotPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.SPOT);
      expect(fromWei(spotPrice)).to.be.lt(10);
      expect(fromWei(spotPrice)).to.be.gt(0.001);
    });

    it('Test WATER Price based on off-chain', async () => {
      const waterPrice = await priceOracle.getPrice(priceOracle.address);
      const currentWaterPrice = Number(process.env.FORK_BLOCK_NUMBER) <= 18063315? 5: 20;
      expect(fromWei(waterPrice)).to.be.eq(currentWaterPrice);
      expect(fromWei(await priceOracle.getWaterPrice())).to.be.eq(currentWaterPrice);
    });
  });
}
