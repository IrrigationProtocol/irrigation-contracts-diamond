import { ethers } from 'hardhat';
import { dc, assert, expect, toWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  MockBeanstalk,
  MockWaterCommonUpgradeable,
  WaterFaucetUpgradeable,
  WaterUpgradeable,
} from '../../typechain-types';

export function suite() {
  describe('Irrigation WaterFaucet Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let gdAddr1: IrrigationDiamond;
    let gdOwner: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let water: WaterUpgradeable;
    let waterFaucet: WaterFaucetUpgradeable;
    let waterCommon: MockWaterCommonUpgradeable;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      gdOwner = await irrigationDiamond.connect(owner);
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
      water = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      waterFaucet = await ethers.getContractAt('WaterFaucetUpgradeable', irrigationDiamond.address);
      waterCommon = await ethers.getContractAt(
        'MockWaterCommonUpgradeable',
        irrigationDiamond.address,
      );
      const beanstalkContract = await ethers.getContractFactory('MockBeanstalk');
      const beanstalk: MockBeanstalk = await beanstalkContract.deploy();
      const fertizerContract = await ethers.getContractFactory('Mock1155Upgradeable');
      const fertilizer = await fertizerContract.deploy();
      await fertilizer.mint(1, 1000);
      await beanstalk.mockSetStalkBalance(sender.address, toWei(2));
      await waterCommon.mockSetBeanstalk(beanstalk.address, fertilizer.address);
    });

    it('Testing WaterFaucet startEpoch', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      await water.connect(owner).approve(irrigationDiamond.address, toWei(100_000));
      let tx = await waterFaucet.connect(owner).startEpoch(toWei(2), toWei(100_000));
      await expect(tx)
        .to.emit(irrigationDiamond, 'EpochStarted')
        .withArgs(0, toWei(2), toWei(100_000));
      updatedBalance = (await water.balanceOf(irrigationDiamond.address)).sub(updatedBalance);
      assert(
        updatedBalance.eq(toWei(100_000)),
        `sender balanceOf should be 100_000, but is ${ethers.utils.formatEther(updatedBalance)}`,
      );
    });

    it('Testing WaterFaucet claim', async () => {
      let updatedBalance = await water.balanceOf(sender.address);
      let tx = await waterFaucet.connect(sender).claim(0, 1);
      await expect(tx)
        .to.emit(irrigationDiamond, 'EpochClaimed')
        .withArgs(0, sender.address, toWei(2));
      updatedBalance = (await water.balanceOf(sender.address)).sub(updatedBalance);
      assert(
        updatedBalance.eq(toWei(2)),
        `sender balanceOf should be 2, but is ${ethers.utils.formatEther(updatedBalance)}`,
      );
    });
  });
}
