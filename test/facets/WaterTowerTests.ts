import { ethers } from 'hardhat';
import { dc, toWei, fromWei, toD6 } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { WaterTowerUpgradeable, WaterUpgradeable } from '../../typechain-types';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';
import { skipTime } from '../utils/time';
import { BigNumber } from 'ethers';
import { assert, expect } from '../utils/debug';

export function suite() {
  describe('Irrigation WaterTower Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let tester: SignerWithAddress;
    let tester2: SignerWithAddress;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let water: WaterUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    const provider = irrigationDiamond.provider;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      tester = signers[2];
      tester2 = signers[7];
      water = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', irrigationDiamond.address);
    });

    it('first pool should be empty and endTime should be month end', async () => {
      const { totalRewardRate, monthlyRewards, endTime } = await waterTower.getPoolInfo(0);
      expect(totalRewardRate).to.be.eq(0);
      expect(monthlyRewards).to.be.eq(0);
      const endAt = new Date(Number(endTime) * 1000);
      assert(
        endAt.getDate() === 30 || endAt.getDate() === 31,
        `pool should be exited at month end, but end date is ${endAt}`,
      );
    });

    it('Test WaterTower deposit and setAutoIrrigate', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      await water.connect(owner).transfer(sender.address, toWei(100));
      await water.connect(sender).approve(irrigationDiamond.address, toWei(100));

      let tx = await waterTower.connect(sender).deposit(toWei(100), false);
      await expect(tx).to.emit(irrigationDiamond, 'Deposited').withArgs(sender.address, toWei(100));
      updatedBalance = (await water.balanceOf(irrigationDiamond.address)).sub(updatedBalance);
      assert(
        updatedBalance.eq(toWei(100)),
        `updated water balance of contract should be 100, but is ${fromWei(updatedBalance)}`,
      );
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
        `updated water balance of contract should be 100, but is ${fromWei(updatedBalance)}`,
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
      // after 30 days
      await skipTime(30 * 86400);
      await waterTower.setPool(0, toWei(1));
      // claim after updating monthly reward
      let updatedEthOfClaimer = await provider.getBalance(sender.address);
      let claimValue = 1;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let tx = await waterTower.connect(sender).claim(toWei(claimValue));
      let txReceipt = await tx.wait();
      updatedEthOfClaimer = (await provider.getBalance(sender.address)).sub(updatedEthOfClaimer);
      assert(
        updatedEthOfClaimer.eq(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        ),
        `updated eth balance of sender should be ${fromWei(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        )}, but is ${fromWei(updatedEthOfClaimer)}`,
      );
      const senderUserInfo = await waterTower.userInfo(sender.address);
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(0);
      expect(senderUserInfo.amount).to.be.eq(toWei(10));
    });

    it('Should claim without other deposit one month after user deposit one time', async () => {
      await skipTime(30 * 86400);
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
        updatedEthOfClaimer.eq(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        ),
        `updated eth balance of sender should be ${fromWei(
          toWei(claimValue).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        )}, but is ${fromWei(updatedEthOfClaimer)}`,
      );
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(0);
    });

    it('Test WaterTower Irrigate with some amount', async () => {
      await skipTime(30 * 86400);
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
      const { waterAmount, bonusAmount, swapAmount } = await waterTower.getBonusForIrrigate(
        irrigateValue,
      );
      /// slippage 5%
      let tx = await waterTower
        .connect(sender)
        .irrigate(irrigateValue, swapAmount.mul(95).div(100));

      await expect(tx)
        .to.emit(irrigationDiamond, 'Claimed')
        .withArgs(sender.address, irrigateValue);
      const addedWaterAmount = (await waterTower.userInfo(sender.address)).amount.sub(
        originalAmount,
      );
      // diff between calculated value and real value should be small than 0.1 %
      expect(addedWaterAmount.sub(bonusAmount.add(waterAmount)).abs().mul(1000)).to.be.lte(
        addedWaterAmount,
      );
      await expect(tx)
        .to.emit(irrigationDiamond, 'Deposited')
        .withArgs(sender.address, addedWaterAmount);
      await expect(tx)
        .to.emit(irrigationDiamond, 'Irrigate')
        .withArgs(
          sender.address,
          CONTRACT_ADDRESSES.BEAN,
          irrigateValue,
          addedWaterAmount,
          addedWaterAmount.mul(5).div(105),
        );

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
      assert(
        (await waterTower.userInfo(tester.address)).isAutoIrrigate,
        'but not set auto irrigate',
      );
      expect(ethRewardForTester).to.be.eq(0);
    });

    it('Test WaterTower: user eth reward should be 0 after irrigate with total amount', async () => {
      let claimValue = 0.5;
      expect(await waterTower.userETHReward(sender.address)).to.be.eq(toWei(claimValue));
      let updatedEthInContract = await provider.getBalance(waterTower.address);
      let irrigateValue = toWei(0.5);
      let originalAmount = (await waterTower.userInfo(sender.address)).amount;
      const { waterAmount, bonusAmount } = await waterTower.getBonusForIrrigate(irrigateValue);
      let tx = await waterTower.connect(sender).irrigate(0, 0);
      const addedWaterAmount = (await waterTower.userInfo(sender.address)).amount.sub(
        originalAmount,
      );
      expect(addedWaterAmount.sub(bonusAmount.add(waterAmount)).abs().mul(1000)).to.be.lte(
        addedWaterAmount,
      );
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
      await skipTime(30 * 86400);
      // set monthly reward and start pool
      await waterTower.setPool(0, toWei(0.5));
      let testerReward = await waterTower.userETHReward(tester.address);
      const oldDepositAmount = (await waterTower.userInfo(tester.address)).amount;
      const { waterAmount, bonusAmount, swapAmount } = await waterTower.getBonusForIrrigate(
        testerReward,
      );
      const autoIrrigateAdmin = signers[5];
      let autoIrrigatorEthBalance = await ethers.provider.getBalance(autoIrrigateAdmin.address);
      // slippage 10% doesn't work for small amount, so we set 20%
      const tx = await waterTower
        .connect(autoIrrigateAdmin)
        .autoIrrigate(tester.address, testerReward.sub(toWei(0.001)), swapAmount.mul(80).div(100));
      let txReceipt = await tx.wait();
      const subractedGasFee = BigNumber.from('877100').mul(txReceipt.effectiveGasPrice);
      testerReward = await waterTower.userETHReward(tester.address);
      expect(
        autoIrrigatorEthBalance.sub(await ethers.provider.getBalance(autoIrrigateAdmin.address)),
      ).to.be.eq(txReceipt.gasUsed.sub(BigNumber.from('877100')).mul(txReceipt.effectiveGasPrice));
      expect(testerReward).to.be.eq(toWei(0.001).sub(subractedGasFee));
      expect((await waterTower.userInfo(tester.address)).amount.sub(oldDepositAmount)).to.be.gt(
        bonusAmount,
      );
      expect(bonusAmount).to.be.gt(toD6(0.01));
    });

    it('AutoIrrigating by signer not admin or autoIrrigateAdmin role should be failed', async () => {
      await expect(
        waterTower.connect(signers[1]).autoIrrigate(tester.address, 0, 0),
      ).to.be.rejectedWith('Only Admin or AutoIrrigate Admin allowed');
    });

    it('totalReward should be same as rewards of total users in same pool', async () => {
      const currentPoolIndex = await waterTower.getPoolIndex();
      let currentPool = await waterTower.getPoolInfo(currentPoolIndex);
      let senderInfo = await waterTower.userInfo(sender.address);
      let testerInfo = await waterTower.userInfo(tester.address);
      if (!senderInfo.lastPoolIndex.eq(currentPoolIndex) && senderInfo.rewardRate.gt(0)) {
        await waterTower.connect(sender).deposit(0, false);
        senderInfo = await waterTower.userInfo(sender.address);
      }
      currentPool = await waterTower.getPoolInfo(currentPoolIndex);
      expect(senderInfo.lastPoolIndex).to.be.eq(currentPoolIndex);
      expect(testerInfo.lastPoolIndex).to.be.eq(currentPoolIndex);
      let senderReward = senderInfo.rewardRate;
      let testerReward = testerInfo.rewardRate;
      expect(currentPool.totalRewardRate).to.be.eq(senderReward.add(testerReward));
    });

    it('Test BatchAutoIrrigate: ', async () => {
      await water.transfer(tester2.address, toWei(100));
      await water.connect(tester2).approve(water.address, toWei(100));
      await waterTower.connect(tester2).deposit(toWei(100), true);

      await skipTime(30 * 86400);
      await waterTower.setPool(0, toWei(0.5));
      let testerReward = await waterTower.userETHReward(tester.address);
      let tester2Reward = await waterTower.userETHReward(tester2.address);
      const testerAmount = (await waterTower.userInfo(tester.address)).amount;
      const tester2Amount = (await waterTower.userInfo(tester2.address)).amount;
      const { waterAmount, bonusAmount, swapAmount } = await waterTower.getBonusForIrrigate(
        testerReward,
      );
      const {
        waterAmount: waterAmount2,
        bonusAmount: bonusAmount2,
        swapAmount: swapAmount2,
      } = await waterTower.getBonusForIrrigate(testerReward);
      const tx = await waterTower.batchAutoIrrigate(
        [tester.address, tester2.address],
        [testerReward.sub(toWei(0.001)), tester2Reward.sub(toWei(0.001))],
        [swapAmount.mul(80).div(100), swapAmount2.mul(80).div(100)],
      );
      let txReceipt = await tx.wait();
      const subractedGasFee = BigNumber.from('877100').mul(txReceipt.effectiveGasPrice);
      testerReward = await waterTower.userETHReward(tester.address);
      expect(testerReward).to.be.eq(toWei(0.001).sub(subractedGasFee));
      expect((await waterTower.userInfo(tester.address)).amount.sub(testerAmount)).to.be.gt(
        bonusAmount,
      );
      expect(bonusAmount).to.be.gt(toD6(0.01));

      tester2Reward = await waterTower.userETHReward(tester2.address);
      expect(tester2Reward).to.be.eq(toWei(0.001).sub(subractedGasFee));
      expect((await waterTower.userInfo(tester2.address)).amount.sub(tester2Amount)).to.be.gt(
        bonusAmount2,
      );
      expect(bonusAmount2).to.be.gt(toD6(0.01));
    });
  });
}
