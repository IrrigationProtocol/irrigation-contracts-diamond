import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { CONTRACT_ADDRESSES, OracleType } from '../../scripts/shared';
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

    it('Test ETH Price based on chainlink oracle', async () => {
      await priceOracle.setOracle(
        CONTRACT_ADDRESSES.ETHER,
        CONTRACT_ADDRESSES.CHAINLINK_ORACLE_ETH,
        ethers.constants.AddressZero,
        OracleType.CHAINLINK,
      );
      const etherPrice = await priceOracle.getUnderlyingPriceETH();
      expect(fromWei(etherPrice)).to.be.lt(10000);
      expect(fromWei(etherPrice)).to.be.gt(1000);
      console.log('ETH price: ', fromWei(etherPrice));
    });

    it('Test Bean Price based on custom oracle', async () => {
      const factory = await ethers.getContractFactory('BeanPriceOracle');
      const beanOracle = await factory.deploy(
        CONTRACT_ADDRESSES.BEAN_3_CURVE,
        CONTRACT_ADDRESSES.THREE_POOL,
      );
      await beanOracle.deployed();
      await priceOracle.setOracle(
        CONTRACT_ADDRESSES.BEAN,
        beanOracle.address,
        ethers.constants.AddressZero,
        OracleType.CUSTOM_ORACLE,
      );
      const beanPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.BEAN);
      expect(fromWei(beanPrice)).to.be.lt(10);
      expect(fromWei(beanPrice)).to.be.gt(0.5);
      console.log('BEAN price: ', fromWei(beanPrice));
    });

    it('Test SPOT Price based on uniswapv3 oracle', async () => {
      await priceOracle.setOracle(
        CONTRACT_ADDRESSES.SPOT,
        CONTRACT_ADDRESSES.UNIV3_POOL_SPOT,
        CONTRACT_ADDRESSES.USDC,
        OracleType.UNISWAP_V3,
      );      
      const spotPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.SPOT);
      expect(fromWei(spotPrice)).to.be.lt(10);
      expect(fromWei(spotPrice)).to.be.gt(0.001);
      console.log('SPOT price: ', fromWei(spotPrice));
    });
  });
}
