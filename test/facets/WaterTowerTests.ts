import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, fromWei, toD6 } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { WaterTowerUpgradeable, WaterUpgradeable } from '../../typechain-types';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { initWaterTower } from '../../scripts/init';
import { time } from '@nomicfoundation/hardhat-network-helpers';

export function suite() {
  describe('Irrigation WaterTower Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let tester: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let water: WaterUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    const provider = irrigationDiamond.provider;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      tester = signers[2];
      water = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', irrigationDiamond.address);
      await initWaterTower(waterTower);
    });

    it('Test WaterTower next epoch info', async () => {
      const { totalRewardRate, monthlyRewards, endTime } = await waterTower.getPoolInfo(0);
      expect(totalRewardRate).to.be.eq(0);
      expect(monthlyRewards).to.be.eq(0);
      const endAt = new Date(Number(endTime) * 1000);
      assert(endAt.getDate() === 30 || endAt.getDate() === 31, `pool should be exited at month end, but end date is ${endAt}`);
    });

    it('Test WaterTower deposit', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      await water.connect(owner).transfer(sender.address, toWei(100));
      await water.connect(sender).approve(irrigationDiamond.address, toWei(100));

      let tx = await waterTower.connect(sender).deposit(toWei(100), false);
      await expect(tx).to.emit(irrigationDiamond, 'Deposited').withArgs(sender.address, toWei(100));
      updatedBalance = (await water.balanceOf(irrigationDiamond.address)).sub(updatedBalance);
      assert(
        updatedBalance.eq(toWei(100)),
        `updated water balance of contract should be 100, but is ${fromWei(
          updatedBalance,
        )}`,
      );
      // let userPoolInfo = await waterTower.userPoolInfo(1, sender.address);
      let userInfo = await waterTower.userInfo(sender.address);
      assert(
        userInfo.amount.eq(toWei(100)),
        `sender balanceOf should be 100, but is ${fromWei(userInfo.amount)}`,
      );
      assert(
        userInfo.isAutoIrrigate === false,
        `sender isAutoIrrigate is not set, but it is set as auto`,
      );
      await waterTower.connect(sender).setAutoIrrigate(true);
      userInfo = await waterTower.userInfo(sender.address);
      assert(userInfo.isAutoIrrigate, `sender isAutoIrrigate is set, but it is not set as auto`);
    });

    it('Test WaterTower withdraw', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      let tx = await waterTower.connect(sender).withdraw(toWei(100));
      await expect(tx).to.emit(irrigationDiamond, 'Withdrawn').withArgs(sender.address, toWei(100));
      updatedBalance = updatedBalance.sub(await water.balanceOf(irrigationDiamond.address));
      assert(
        updatedBalance.eq(toWei(100)),
        `updated water balance of contract should be 100, but is ${fromWei(
          updatedBalance,
        )}`,
      );
      const userInfo = await waterTower.userInfo(sender.address);
      assert(
        userInfo.amount.eq(toWei(0)),
        `sender balanceOf should be 0, but is ${fromWei(userInfo.amount)}`,
      );
    });

    it('Test WaterTower claim for one depositer', async () => {
      await water.connect(sender).approve(irrigationDiamond.address, toWei(10));
      await waterTower.connect(sender).deposit(toWei(10), false);
      await waterTower.addETHReward({ value: toWei(10) });

      let lastTime = await time.latest();
      await time.setNextBlockTimestamp(lastTime + 30 * 86400);
      await waterTower.setPool(0, toWei(1));
      // claim after updating monthly reward
      let updatedEthOfClaimer = await provider.getBalance(sender.address);
      let claimValue = 1;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let tx = await waterTower.connect(sender).claim(toWei(claimValue));
      let txReceipt = await tx.wait();
      updatedEthOfClaimer = (await provider.getBalance(sender.address)).sub(updatedEthOfClaimer);
      assert(
        updatedEthOfClaimer.eq(toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice))),
        `updated eth balance of sender should be ${fromWei(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        )}, but is ${fromWei(updatedEthOfClaimer)}`,
      );
      const senderUserInfo = await waterTower.userInfo(sender.address);
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(0);
      expect(senderUserInfo.amount).to.be.eq(toWei(10));
    });

    it('Should claim without other deposit one month after user deposit one time', async () => {
      let lastTime = await time.latest();
      await time.setNextBlockTimestamp(lastTime + 30 * 86400);
      // set monthly reward and new month
      await waterTower.setPool(0, toWei(1));
      expect(Number(await waterTower.getPoolIndex())).to.be.eq(3);
      let updatedEthOfClaimer = await provider.getBalance(sender.address);
      let claimValue = 1;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let tx = await waterTower.connect(sender).claim(0);
      let txReceipt = await tx.wait();
      updatedEthOfClaimer = (await provider.getBalance(sender.address)).sub(updatedEthOfClaimer);
      assert(
        updatedEthOfClaimer.eq(toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice))),
        `updated eth balance of sender should be ${fromWei(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        )}, but is ${fromWei(updatedEthOfClaimer)}`,
      );
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(0);
    });

    it('Test WaterTower Irrigate with some amount', async () => {
      let lastTime = await time.latest();
      await time.setNextBlockTimestamp(lastTime + 30 * 86400);
      // set monthly reward and new month
      await waterTower.setPool(0, toWei(1));
      expect(Number(await waterTower.getPoolIndex())).to.be.eq(4);
      let claimValue = 1;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let updatedEthInContract = await provider.getBalance(waterTower.address);
      let irrigateValue = toWei(0.5);
      const sprinkler = await ethers.getContractAt('SprinklerUpgradeable', waterTower.address);
      const whitelisted = await sprinkler.getWhitelist();
      if (!whitelisted.includes(CONTRACT_ADDRESSES.BEAN)) {
        await sprinkler.addAssetToWhiteList(CONTRACT_ADDRESSES.BEAN, 0);
      }
      let originalAmount = (await waterTower.userInfo(sender.address)).amount;
      const { waterAmount, bonusAmount } = await waterTower.getBonusForIrrigate(irrigateValue);

      let tx = await waterTower.connect(sender).irrigate(irrigateValue);
      const addedWaterAmount = (await waterTower.userInfo(sender.address)).amount.sub(originalAmount);
      // diff between calculated value and real value should be small than 0.1 %
      expect(addedWaterAmount.sub(bonusAmount.add(waterAmount)).abs().mul(1000)).to.be.lte(addedWaterAmount);
      updatedEthInContract = updatedEthInContract.sub(
        await provider.getBalance(waterTower.address),
      );
      assert(
        updatedEthInContract.eq(irrigateValue),
        `updated ether in contract should be ${fromWei(irrigateValue)}, but is ${fromWei(
          updatedEthInContract,
        )}`,
      );
      const ethRewardForSender = await waterTower.userETHReward(sender.address);
      expect(ethRewardForSender).to.be.eq(toWei(0.5));
    });

    it('Test WaterTower deposit for two accounts', async () => {
      await water.connect(tester).approve(irrigationDiamond.address, toWei(50));
      await water.transfer(tester.address, toWei(50));
      let tx = await waterTower.connect(tester).deposit(toWei(50), true);
      expect((await waterTower.userInfo(tester.address)).amount).to.be.eq(toWei(50));
      const ethRewardForTester = await waterTower.userETHReward(tester.address);
      assert(((await waterTower.userInfo(tester.address)).isAutoIrrigate), 'but not set auto irrigate')
      expect(ethRewardForTester).to.be.eq(0);
    });

    it('Test WaterTower: user eth reward should be 0 after irrigate with total amount', async () => {
      let claimValue = 0.5;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let updatedEthInContract = await provider.getBalance(waterTower.address);
      let irrigateValue = toWei(0.5);
      let originalAmount = (await waterTower.userInfo(sender.address)).amount;
      const { waterAmount, bonusAmount } = await waterTower.getBonusForIrrigate(irrigateValue);
      let tx = await waterTower.connect(sender).irrigate(0);
      const addedWaterAmount = (await waterTower.userInfo(sender.address)).amount.sub(originalAmount);
      expect(addedWaterAmount.sub(bonusAmount.add(waterAmount)).abs().mul(1000)).to.be.lte(addedWaterAmount);
      updatedEthInContract = updatedEthInContract.sub(
        await provider.getBalance(waterTower.address),
      );
      assert(
        updatedEthInContract.eq(irrigateValue),
        `updated ether in contract should be ${fromWei(irrigateValue)}, but is ${fromWei(
          updatedEthInContract,
        )}`,
      );
      const ethRewardForSender = await waterTower.userETHReward(sender.address);
      expect(ethRewardForSender).to.be.eq(0);
    });

    it('Test WaterTower: irrigator amount should be increased after auto irrigate', async () => {
      await time.setNextBlockTimestamp(await time.latest() + 30 * 86400);
      // set monthly reward and start pool
      await waterTower.setPool(0, toWei(0.5));
      const testerReward = await waterTower.userETHReward(tester.address);
      const oldDepositAmount = (await waterTower.userInfo(tester.address)).amount;
      const { waterAmount, bonusAmount } = await waterTower.getBonusForIrrigate(testerReward);
      await waterTower.autoIrrigate(tester.address);
      expect((await waterTower.userInfo(tester.address)).amount.sub(oldDepositAmount)).to.be.gt(bonusAmount);
      expect(bonusAmount).to.be.gt(toD6(0.01));
      // deposit for eligible of tranche feature      
      await water.approve(waterTower.address, toWei(1000));
      await waterTower.deposit(toWei(100), false);
    });
  });
}
