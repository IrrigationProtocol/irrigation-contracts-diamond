import { ethers } from 'hardhat';
import { dc, assert, expect, toWei, facetDeployedInfo, fromWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { WaterTowerUpgradeable, WaterUpgradeable } from '../../typechain-types';

export function suite() {
  describe('Irrigation WaterTower Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let gdAddr1: IrrigationDiamond;
    let gdOwner: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let water: WaterUpgradeable;
    let waterTower: WaterTowerUpgradeable;
    let waterTowerFacetAddress: string;
    const provider = irrigationDiamond.provider;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      gdOwner = await irrigationDiamond.connect(owner);
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
      water = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      waterTower = await ethers.getContractAt('WaterTowerUpgradeable', irrigationDiamond.address);
      waterTowerFacetAddress = facetDeployedInfo['WaterTowerUpgradeable']?.address;
    });

    it('Testing WaterTower deposit', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      await water.connect(owner).transfer(sender.address, toWei(100));
      await water.connect(sender).approve(irrigationDiamond.address, toWei(100));

      let tx = await waterTower.connect(sender).deposit(toWei(100));
      await expect(tx).to.emit(irrigationDiamond, 'Deposited').withArgs(sender.address, toWei(100));
      updatedBalance = (await water.balanceOf(irrigationDiamond.address)).sub(updatedBalance);
      assert(
        updatedBalance.eq(toWei(100)),
        `updated water balance of contract should be 100, but is ${ethers.utils.formatEther(
          updatedBalance,
        )}`,
      );
      const userInfo = await waterTower.userInfo(sender.address);
      assert(
        userInfo.amount.eq(toWei(100)),
        `sender balanceOf should be 100, but is ${ethers.utils.formatEther(userInfo.amount)}`,
      );
    });

    it('Testing WaterTower withdraw', async () => {
      let updatedBalance = await water.balanceOf(irrigationDiamond.address);
      let tx = await waterTower.connect(sender).withdraw(toWei(100));
      await expect(tx).to.emit(irrigationDiamond, 'Withdrawn').withArgs(sender.address, toWei(100));
      updatedBalance = updatedBalance.sub(await water.balanceOf(irrigationDiamond.address));
      assert(
        updatedBalance.eq(toWei(100)),
        `updated water balance of contract should be 100, but is ${ethers.utils.formatEther(
          updatedBalance,
        )}`,
      );
      const userInfo = await waterTower.userInfo(sender.address);
      assert(
        userInfo.amount.eq(toWei(0)),
        `sender balanceOf should be 100, but is ${fromWei(userInfo.amount)}`,
      );
    });

    it('Testing WaterTower Claim', async () => {
      await water.connect(sender).approve(irrigationDiamond.address, toWei(10));
      await waterTower.connect(sender).deposit(toWei(10));
      await owner.sendTransaction({ to: waterTower.address, value: toWei(100) });
      let shareWater = await waterTower.sharePerWater();
      assert(
        shareWater.eq(toWei(100 / 10)),
        `sharePerWater should be ${100 / 10}, but is ${fromWei(shareWater)}`,
      );
      await water.connect(owner).approve(irrigationDiamond.address, toWei(40));
      await waterTower.connect(owner).deposit(toWei(40));
      let ownerUserInfo = await waterTower.userInfo(owner.address);
      assert(
        ownerUserInfo.debt.eq(shareWater.mul(toWei(40))),
        `debt of owner should be ${fromWei(shareWater.mul(40))}, but is ${fromWei(
          ownerUserInfo.debt,
        )}`,
      );
      await signers[2].sendTransaction({ to: waterTower.address, value: toWei(10) });
      shareWater = await waterTower.sharePerWater();
      assert(
        shareWater.eq(toWei(100 / 10 + 10 / 50)),
        `sharePerWater should be ${100 / 10 + 10 / 50}, but is ${fromWei(shareWater)}`,
      );
      let updatedEthOfClaimer = await provider.getBalance(sender.address);
      let claimValue = 102;
      let tx = await waterTower.connect(sender).claim(toWei(claimValue));
      const txReceipt = await tx.wait();
      updatedEthOfClaimer = (await provider.getBalance(sender.address)).sub(updatedEthOfClaimer);
      assert(
        updatedEthOfClaimer.eq(toWei(102).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice))),
        `updated eth balance of sender should be ${fromWei(
          toWei(102).sub(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)),
        )}, but is ${fromWei(updatedEthOfClaimer)}`,
      );
      let senderUserInfo = await waterTower.userInfo(sender.address);
      assert(
        senderUserInfo.debt.eq(shareWater.mul(toWei(10))),
        `debt of sender should be ${fromWei(shareWater.mul(10))}, but is ${fromWei(
          senderUserInfo.debt,
        )}`,
      );
      assert(
        senderUserInfo.pending.eq(shareWater.mul(toWei(10)).sub(toWei(claimValue).mul(toWei(1)))),
        `pending of sender should be ${fromWei(
          shareWater.mul(toWei(10)).sub(toWei(claimValue).mul(toWei(1))),
        )}, but is ${fromWei(senderUserInfo.pending)}`,
      );
      await expect(tx).to.emit(waterTower, 'Claimed').withArgs(sender.address, toWei(claimValue));
      claimValue = 110 - claimValue;
      tx = await waterTower.connect(owner).claim(toWei(claimValue));
      const oldDebtOfOwner = ownerUserInfo.debt;      
      ownerUserInfo = await waterTower.userInfo(owner.address);
      assert(
        ownerUserInfo.pending.eq(
          shareWater
            .mul(toWei(40))
            .sub(oldDebtOfOwner)
            .sub(toWei(claimValue).mul(toWei(1))),
        ),
        `pending of owner should be ${fromWei(
          shareWater
            .mul(toWei(40))
            .sub(oldDebtOfOwner)
            .sub(toWei(claimValue).mul(toWei(1))),
        )}, but is ${fromWei(ownerUserInfo.pending)}`,
      );
      await expect(tx).to.emit(waterTower, 'Claimed').withArgs(owner.address, toWei(claimValue));
    });
  });
}
