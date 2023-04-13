import { ethers } from 'hardhat';
import { dc, assert, toWei, toD6, fromD6, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  MockERC20Upgradeable,
  MockPriceOracle,
  SprinklerUpgradeable,
  WaterUpgradeable,
} from '../../typechain-types';
import { BigNumber } from 'ethers';

export function suite() {
  describe('Irrigation Sprintkler Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let sender: SignerWithAddress;
    let tester2: SignerWithAddress;
    let priceOracle1: MockPriceOracle;
    let priceOracle2: MockPriceOracle;
    let priceOracleForWater: MockPriceOracle;
    let sprinkler: SprinklerUpgradeable;
    let waterToken: WaterUpgradeable;
    const irrigationMainAddress: string = irrigationDiamond.address;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      tester2 = signers[2];
      const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');
      token1 = await mockTokenContract.deploy();
      await token1.Token_Initialize('Bean', 'BEAN', toWei(100_000_000));
      const mockTokenContractD6 = await ethers.getContractFactory('MockERC20D6Upgradeable');
      token2 = await mockTokenContractD6.deploy();
      await token2.Token_Initialize('Stalk', 'STALK', toWei(100_000_000));
      const priceOracleContract = await ethers.getContractFactory('MockPriceOracle');
      priceOracle1 = await priceOracleContract.deploy();
      priceOracle2 = await priceOracleContract.deploy();
      priceOracleForWater = await priceOracleContract.deploy();
      sprinkler = await ethers.getContractAt('SprinklerUpgradeable', irrigationMainAddress);
      waterToken = await ethers.getContractAt('WaterUpgradeable', irrigationMainAddress);
    });

    it('Test Sprinkler Whitelist', async () => {
      await sprinkler.addAssetToWhiteList(token1.address, priceOracle1.address, 0);
      await sprinkler.addAssetToWhiteList(token2.address, priceOracle2.address, 0);
      const whitelist = await sprinkler.getWhitelist();
      assert(
        whitelist[0] === token1.address && whitelist[1] === token2.address,
        `expected whitelist 2 tokens, but ${whitelist}`,
      );
    });

    it('Test Sprinkler price oracles', async () => {
      const priceOracleAddress1 = await sprinkler.priceOracle(token1.address);
      assert(
        priceOracleAddress1 === priceOracle1.address,
        `price oracles is failed ${priceOracleAddress1}`,
      );
      const priceOracleAddress2 = await sprinkler.priceOracle(token2.address);
      assert(
        priceOracleAddress2 === priceOracle2.address,
        `price oracles is failed ${priceOracleAddress2}`,
      );
    });

    it('Test Sprinkler get amount to exchange', async () => {
      await sprinkler.setWaterPriceOracle(priceOracleForWater.address);
      await priceOracleForWater.mockSetPrice(toWei(3));
      await priceOracle1.mockSetPrice(toWei(2));
      const amount = await sprinkler.getWaterAmount(token1.address, toWei(100));
      const token1Price = await priceOracle1.latestPrice();
      const waterPrice = await priceOracleForWater.latestPrice();
      const token1Multiplier = await sprinkler.tokenMultiplier(token1.address);
      assert(
        token1Multiplier.eq(BigNumber.from(1)),
        `expected token multiplier is ${1}, but ${token1Multiplier}`,
      );
      const expectedWaterAmount = toWei(100).mul(token1Price).mul(token1Multiplier).div(waterPrice);
      assert(
        expectedWaterAmount.eq(amount),
        `expected water is ${expectedWaterAmount}, received water amount is ${fromWei(amount)}`,
      );
    });

    it('Test Sprinkler exchange token', async () => {
      // await gdOwner.setTokenMultiplier(token1.address, 2);
      await token1.connect(owner).transfer(sender.address, toWei(100));
      let balance1 = await token1.balanceOf(sender.address);
      assert(
        balance1.eq(toWei(100)),
        `sender balanceOf should be 100, but is ${ethers.utils.formatEther(balance1)}`,
      );

      await waterToken.connect(owner).transfer(irrigationMainAddress, toWei(10000));
      const waterBalanceOfIrrigation = await waterToken.balanceOf(irrigationMainAddress);
      assert(
        waterBalanceOfIrrigation.eq(toWei(10000)),
        `irrigation balanceOf water should be 10000, but is ${ethers.utils.formatEther(
          waterBalanceOfIrrigation,
        )}`,
      );

      await sprinkler.setWaterPriceOracle(priceOracleForWater.address);
      await priceOracleForWater.mockSetPrice(toWei(3));
      await priceOracle1.mockSetPrice(toWei(2));
      await token1.connect(sender).approve(irrigationMainAddress, toWei(100));
      await sprinkler.connect(sender).exchangeTokenToWater(token1.address, toWei(100));
      balance1 = await token1.balanceOf(sender.address);

      const waterBalance = await waterToken.balanceOf(sender.address);
      assert(
        balance1.eq(toWei(0)),
        `Sender balanceOf should be 0, but is ${ethers.utils.formatEther(balance1)}`,
      );
      const token1Price = await priceOracle1.latestPrice();
      const waterPrice = await priceOracleForWater.latestPrice();
      const token1Multiplier = await sprinkler.tokenMultiplier(token1.address);
      const expectedWaterAmount = toWei(100).mul(token1Price).mul(token1Multiplier).div(waterPrice);
      assert(
        expectedWaterAmount.eq(waterBalance),
        `received water balance is ${ethers.utils.formatEther(waterBalance)}`,
      );
    });

    it('Test Sprinkler exchange token with decimals 6', async () => {
      await token2.connect(owner).transfer(tester2.address, toD6(250));
      let balance2 = await token2.balanceOf(tester2.address);
      assert(balance2.eq(toD6(250)), `sender balanceOf should be 100, but is ${fromD6(balance2)}`);
      await waterToken.connect(owner).transfer(irrigationMainAddress, toWei(10000));
      await priceOracleForWater.mockSetPrice(toWei(3));
      await priceOracle2.mockSetPrice(toWei(2.5));
      await token2.connect(tester2).approve(irrigationMainAddress, toD6(250));
      await sprinkler.connect(tester2).exchangeTokenToWater(token2.address, toD6(250));

      balance2 = await token2.balanceOf(tester2.address);
      const waterBalance = await waterToken.balanceOf(tester2.address);
      assert(
        balance2.eq(toWei(0)),
        `Sender balanceOf should be 0, but is ${ethers.utils.formatEther(balance2)}`,
      );
      const tokenPrice = await priceOracle2.latestPrice();
      const waterPrice = await priceOracleForWater.latestPrice();
      const token2Multiplier = await sprinkler.tokenMultiplier(token2.address);
      const expectedWaterAmount = toD6(250).mul(tokenPrice).mul(token2Multiplier).div(waterPrice);
      assert(
        expectedWaterAmount.eq(waterBalance),
        `received water balance is ${fromWei(waterBalance)}`,
      );
    });
  });
}
