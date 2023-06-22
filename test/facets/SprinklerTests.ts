import { ethers } from 'hardhat';
import { dc, assert, toWei, toD6, fromD6, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  IERC20Upgradeable,
  PriceOracleUpgradeable,
  SprinklerUpgradeable,
  WaterUpgradeable,
} from '../../typechain-types';
import { BigNumber } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { whitelist } from '../../scripts/init';
import { expect } from 'chai';

export function suite() {
  describe('Irrigation Sprintkler Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: IERC20Upgradeable;
    let token2: IERC20Upgradeable;
    let sender: SignerWithAddress;
    let tester2: SignerWithAddress;
    let receiver: SignerWithAddress;
    let sprinkler: SprinklerUpgradeable;
    let waterToken: WaterUpgradeable;
    let priceOracle: PriceOracleUpgradeable;
    const irrigationMainAddress: string = irrigationDiamond.address;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      tester2 = signers[2];
      receiver = signers[3];
      token1 = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.DAI);
      token2 = await ethers.getContractAt('IERC20Upgradeable', CONTRACT_ADDRESSES.BEAN);
      sprinkler = await ethers.getContractAt('SprinklerUpgradeable', irrigationMainAddress);
      waterToken = await ethers.getContractAt('WaterUpgradeable', irrigationMainAddress);
      priceOracle = await ethers.getContractAt('PriceOracleUpgradeable', irrigationMainAddress);
    });
    it('Test Sprinkler sprinkleable water amount should be enough', async () => {
      expect(await sprinkler.sprinkleableWater()).to.be.eq(toWei(10_000));
      const waterBalanceOfIrrigation = await waterToken.balanceOf(irrigationMainAddress);
      assert(
        waterBalanceOfIrrigation.eq(toWei(10_000)),
        `irrigation balanceOf water should be 10000, but is ${ethers.utils.formatEther(
          waterBalanceOfIrrigation,
        )}`,
      );
    });
    it('Test Sprinkler Whitelist', async () => {
      const gotWhitelist = await sprinkler.getWhitelist();
      assert(
        gotWhitelist[0] == whitelist[0],
        `expected whitelist token ${whitelist[0]}, but ${gotWhitelist[0]}`,
      );
      assert(
        gotWhitelist[gotWhitelist.length - 1] == whitelist[gotWhitelist.length - 1],
        `expected whitelist token ${whitelist[gotWhitelist.length - 1]}, but ${gotWhitelist[gotWhitelist.length - 1]
        }`,
      );
    });

    it('Test Sprinkler get amount to exchange', async () => {
      const amount = await sprinkler.getWaterAmount(token1.address, toWei(100));
      const token1Price = await priceOracle.getPrice(token1.address);
      const waterPrice = await priceOracle.getWaterPrice();
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
      await token1.connect(owner).transfer(sender.address, toWei(100));
      let balance1 = await token1.balanceOf(sender.address);
      assert(
        balance1.eq(toWei(100)),
        `sender balanceOf should be 100, but is ${ethers.utils.formatEther(balance1)}`,
      );

      await priceOracle.setDirectPrice(priceOracle.address, toWei(2));
      await token1.connect(sender).approve(irrigationMainAddress, toWei(100));
      await sprinkler.connect(sender).exchangeTokenToWater(token1.address, toWei(100));
      balance1 = await token1.balanceOf(sender.address);

      const waterBalance = await waterToken.balanceOf(sender.address);
      assert(
        balance1.eq(toWei(0)),
        `Sender balanceOf should be 0, but is ${ethers.utils.formatEther(balance1)}`,
      );
      const token1Price = await priceOracle.getPrice(token1.address);
      const waterPrice = await priceOracle.getWaterPrice();
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
      await priceOracle.setDirectPrice(priceOracle.address, toWei(3));
      await token2.connect(tester2).approve(irrigationMainAddress, toD6(250));
      let waterBalance = await waterToken.balanceOf(tester2.address);
      await sprinkler.connect(tester2).exchangeTokenToWater(token2.address, toD6(250));
      const waterAmount = await sprinkler.getWaterAmount(token2.address, toD6(250));
      balance2 = await token2.balanceOf(tester2.address);
      waterBalance = await waterToken.balanceOf(tester2.address);
      assert(
        balance2.eq(toWei(0)),
        `Sender balanceOf should be 0, but is ${ethers.utils.formatEther(balance2)}`,
      );
      const tokenPrice = await priceOracle.getPrice(token2.address);
      const waterPrice = await priceOracle.getWaterPrice();
      const token2Multiplier = await sprinkler.tokenMultiplier(token2.address);

      const expectedWaterAmount = toD6(250).mul(tokenPrice).mul(token2Multiplier).div(waterPrice);
      assert(
        expectedWaterAmount.eq(waterAmount),
        `should be ${fromWei(expectedWaterAmount)}, but get water amount is ${fromWei(
          waterAmount,
        )}`,
      );
      assert(
        expectedWaterAmount.eq(waterBalance),
        `should be ${fromWei(expectedWaterAmount)}, but received water balance is ${fromWei(
          waterBalance,
        )}`,
      );
    });

    it('Test Sprinkler should revert for exchange with amount bigger than sprinkleable amount', async () => {
      await expect(
        sprinkler.connect(sender).exchangeTokenToWater(token1.address, toWei(990_000)),
      ).to.be.revertedWithCustomError(sprinkler, 'InsufficientWater');
    });

    it('Test Sprinkler should buy the same amount of water as getWaterAmount with ether', async () => {
      let waterBalance = await waterToken.balanceOf(sender.address);
      await sprinkler.connect(sender).exchangeETHToWater({ value: toWei(0.1) });
      waterBalance = (await waterToken.balanceOf(sender.address)).sub(waterBalance);
      const etherPrice = await priceOracle.getPrice(CONTRACT_ADDRESSES.ETHER);
      const waterPrice = await priceOracle.getPrice(waterToken.address);
      expect(waterBalance.mul(waterPrice).eq(etherPrice.mul(toWei(0.1))));
      const waterAmountForETH = await sprinkler.getWaterAmount(CONTRACT_ADDRESSES.ETHER, toWei(0.1));
      expect(waterAmountForETH.eq(waterBalance));
    });

    it('Test SuperAdmin should be able to withdraw only ether swapped', async () => {
      let reserveEther = await sprinkler.getReserveToken(CONTRACT_ADDRESSES.ETHER);
      expect(reserveEther).to.be.eq(toWei(0.1));
      let updatedReceiverEtherBalance = await ethers.provider.getBalance(receiver.address);
      await sprinkler.withdrawToken(CONTRACT_ADDRESSES.ETHER, receiver.address, toWei(0.1));
      updatedReceiverEtherBalance = (await ethers.provider.getBalance(receiver.address)).sub(updatedReceiverEtherBalance);
      expect(updatedReceiverEtherBalance).to.be.eq(toWei(0.1));
      reserveEther = await sprinkler.getReserveToken(CONTRACT_ADDRESSES.ETHER);
      expect(reserveEther).to.be.eq(toWei(0));
      /// even if contract ether balance is enough, withdraw ether should be failed. so we will not confuse swapped ether
      /// from ether for reward
      await owner.sendTransaction({ to: sprinkler.address, value: toWei(0.02) });
      /// overflowed operation error even if our contract has enough balance
      await expect(sprinkler.withdrawToken(CONTRACT_ADDRESSES.ETHER, receiver.address, toWei(0.001))).to.be.revertedWith('');
    });

    it('Test SuperAdmin should be able to withdraw swapped tokens', async () => {
      let reserveDAI = await sprinkler.getReserveToken(token1.address);
      expect(reserveDAI).to.be.eq(toWei(100));      
      await sprinkler.withdrawToken(CONTRACT_ADDRESSES.DAI, receiver.address, toWei(100));      
      expect(await token1.balanceOf(receiver.address)).to.be.eq(toWei(100));      
    });

  });
}
