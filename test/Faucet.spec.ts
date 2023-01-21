import { expect } from 'chai';
import { ethers } from 'hardhat';
import { utils, constants } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { WaterFaucetUpgradeable, MockERC20Upgradeable, Mock1155Upgradeable } from '../typechain-types';

describe('Faucet', () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let waterToken: MockERC20Upgradeable;
  let stalkToken: MockERC20Upgradeable;
  let podsToken: MockERC20Upgradeable;
  let fertToken: Mock1155Upgradeable;
  let faucet: WaterFaucetUpgradeable;

  const STALK_MIN_AMOUNT = utils.parseEther('1');
  const PODS_MIN_AMOUNT = utils.parseEther('1');

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    waterToken = <MockERC20Upgradeable>(
      await MockERC20Factory.deploy(
        'Water',
        'Water',
        utils.parseEther('10000000'),
      )
    );

    stalkToken = <MockERC20Upgradeable>(
      await MockERC20Factory.deploy(
        'Stalk',
        'Stalk',
        utils.parseEther('10000000'),
      )
    );

    podsToken = <MockERC20Upgradeable>(
      await MockERC20Factory.deploy(
        'Pods',
        'Pods',
        utils.parseEther('10000000'),
      )
    );

    const Mock1155Factory = await ethers.getContractFactory('Mock1155');
    fertToken = <Mock1155Upgradeable>await Mock1155Factory.deploy();

    const FaucetFactory = await ethers.getContractFactory('Faucet');
    faucet = <WaterFaucetUpgradeable>(
      await FaucetFactory.deploy(
        waterToken.address,
        stalkToken.address,
        podsToken.address,
        fertToken.address,
      )
    );

    await waterToken.approve(faucet.address, constants.MaxUint256);
  });

  describe('Check constructor and initial values', () => {
    it('check inital values', async () => {
      expect(await faucet.owner()).to.be.equal(owner.address);
      expect(await faucet.waterToken()).to.be.equal(waterToken.address);
      expect(await faucet.stalkToken()).to.be.equal(stalkToken.address);
      expect(await faucet.podsToken()).to.be.equal(podsToken.address);
      expect(await faucet.fertToken()).to.be.equal(fertToken.address);
    });

    it('it reverts if water token is zero', async () => {
      const FaucetFactory = await ethers.getContractFactory('Faucet');

      await expect(
        FaucetFactory.deploy(
          constants.AddressZero,
          stalkToken.address,
          podsToken.address,
          fertToken.address,
        ),
      ).to.be.revertedWith('zero addr');
    });

    it('it reverts if stalk token is zero', async () => {
      const FaucetFactory = await ethers.getContractFactory('Faucet');

      await expect(
        FaucetFactory.deploy(
          waterToken.address,
          constants.AddressZero,
          podsToken.address,
          fertToken.address,
        ),
      ).to.be.revertedWith('zero addr');
    });

    it('it reverts if pods token is zero', async () => {
      const FaucetFactory = await ethers.getContractFactory('Faucet');

      await expect(
        FaucetFactory.deploy(
          waterToken.address,
          stalkToken.address,
          constants.AddressZero,
          fertToken.address,
        ),
      ).to.be.revertedWith('zero addr');
    });

    it('it reverts if fert token is zero', async () => {
      const FaucetFactory = await ethers.getContractFactory('Faucet');

      await expect(
        FaucetFactory.deploy(
          waterToken.address,
          stalkToken.address,
          podsToken.address,
          constants.AddressZero,
        ),
      ).to.be.revertedWith('zero addr');
    });
  });

  describe('#startEpoch', () => {
    it('it reverts if msg.sender is not owner', async () => {
      await expect(
        faucet.connect(alice).startEpoch(100, 100),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('it reverts if total amount is zero', async () => {
      await expect(faucet.connect(owner).startEpoch(100, 0)).to.be.revertedWith(
        'zero amount',
      );
    });

    it('it reverts if amount per user amount is zero', async () => {
      await expect(faucet.connect(owner).startEpoch(0, 100)).to.be.revertedWith(
        'zero amount',
      );
    });

    it('it reverts if total amount is not multiplier of amount per user', async () => {
      await expect(
        faucet.connect(owner).startEpoch(10, 101),
      ).to.be.revertedWith('invalid amount');
    });

    it('start new epoch', async () => {
      await faucet.connect(owner).startEpoch(10, 100);

      const epoch = await faucet.epochs(0);
      expect(epoch.amountPerUser).to.be.equal(10);
      expect(epoch.totalAmount).to.be.equal(100);
      expect(epoch.claimedAmount).to.be.equal(0);
    });

    it('transfer water token from owner', async () => {
      await faucet.connect(owner).startEpoch(10, 100);

      expect(await waterToken.balanceOf(faucet.address)).to.be.equal(100);
    });

    it('emit the event', async () => {
      const tx = await faucet.connect(owner).startEpoch(10, 100);

      await expect(tx).to.be.emit(faucet, 'EpochStarted').withArgs(0, 10, 100);
    });
  });

  describe('#claim', () => {
    const amountPerUser = utils.parseEther('10');
    const totalAmount = utils.parseEther('50');
    const epoch = 0;
    const fertTokenId = 1;

    beforeEach(async () => {
      await faucet.connect(owner).startEpoch(amountPerUser, totalAmount);
      await stalkToken.transfer(alice.address, STALK_MIN_AMOUNT);
    });

    it('it reverts if user does not hold any token or hold less than min amount', async () => {
      await stalkToken.transfer(bob.address, utils.parseEther('0.1'));
      await expect(
        faucet.connect(bob).claim(epoch, fertTokenId),
      ).to.be.revertedWith('nothing hold');
    });

    it('claim from faucet when user holds stalk token', async () => {
      await stalkToken.transfer(bob.address, STALK_MIN_AMOUNT);
      await faucet.connect(bob).claim(epoch, 0);

      expect(await waterToken.balanceOf(bob.address)).to.be.equal(
        amountPerUser,
      );
    });

    it('claim from faucet when user holds pods token', async () => {
      await podsToken.transfer(bob.address, PODS_MIN_AMOUNT);
      await faucet.connect(bob).claim(epoch, 0);

      expect(await waterToken.balanceOf(bob.address)).to.be.equal(
        amountPerUser,
      );
    });

    it('claim from faucet when user holds fert token', async () => {
      await fertToken.connect(bob).mint(fertTokenId, 1);
      await faucet.connect(bob).claim(epoch, fertTokenId);

      expect(await waterToken.balanceOf(bob.address)).to.be.equal(
        amountPerUser,
      );
    });

    it('update epoch state', async () => {
      await faucet.connect(alice).claim(epoch, 0);

      const epochData = await faucet.epochs(epoch);
      expect(epochData.amountPerUser).to.be.equal(amountPerUser);
      expect(epochData.totalAmount).to.be.equal(totalAmount);
      expect(epochData.claimedAmount).to.be.equal(amountPerUser);

      expect(await faucet.claimed(alice.address, epoch)).to.be.true;
    });

    it('emit the event', async () => {
      const tx = await faucet.connect(alice).claim(epoch, 0);

      await expect(tx)
        .to.be.emit(faucet, 'Claimed')
        .withArgs(epoch, alice.address);
    });

    it('it reverts if user already claimed', async () => {
      await faucet.connect(alice).claim(epoch, 0);

      await expect(faucet.connect(alice).claim(epoch, 0)).to.be.revertedWith(
        'already claimed',
      );
    });

    it('it reverts if faucet is out of fund', async () => {
      const accounts = await ethers.getSigners();

      for (let i = 0; i < totalAmount.div(amountPerUser).toNumber(); i += 1) {
        const userIdx = i + 3;
        await podsToken.transfer(accounts[userIdx].address, PODS_MIN_AMOUNT);

        await faucet.connect(accounts[userIdx]).claim(epoch, 0);
      }

      await expect(faucet.connect(alice).claim(epoch, 0)).to.be.revertedWith(
        'out of water',
      );
    });
  });
});
