import { ethers } from 'hardhat';
import { dc, toWei } from '../scripts/common';
import { assert, expect } from './utils/debug';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { IERC20Upgradeable__factory, WaterUpgradeable } from '../typechain-types/';
import { getInterfaceID } from '../scripts/FacetSelectors';

const NAME = 'Water Token';
const SYMBOL = 'WATER';
const DECIMALS = 18;

export function suite() {
  describe('Irrigation ERC20 Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: string;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let waterToken: WaterUpgradeable;
    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0].address;
      waterToken = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
    });

    it('Testing Irrigation ERC20 interface is supported', async () => {
      const IERC20UpgradeableInterface = IERC20Upgradeable__factory.createInterface();
      // interface ID does not include base contract(s) functions.
      const IERC20InterfaceID = getInterfaceID(IERC20UpgradeableInterface);
      const loupe = await ethers.getContractAt('DiamondLoupeFacet', irrigationDiamond.address);
      assert(
        await loupe.supportsInterface(IERC20InterfaceID._hex),
        "Doesn't support IERC20Upgradeable",
      );
    });

    it('Test Water ERC20 token name, symbol, and decimals', async () => {
      expect(await waterToken.name()).to.be.equal(NAME);
      expect(await waterToken.symbol()).to.be.equal(SYMBOL);
      expect(await waterToken.decimals()).to.be.eq(DECIMALS);
    });
    it('Testing Irrigation ERC20 transfer', async () => {
      const waterSupply = await waterToken.totalSupply();
      assert(
        waterSupply.eq(toWei(100000000)),
        `Irrigation Supply should be 100000000, but is ${ethers.utils.formatEther(waterSupply)}`,
      );

      const ownerSupply = await waterToken.balanceOf(owner);
      assert(
        ownerSupply.gt(toWei(100)),
        `Owner balanceOf should be > 100, but is ${ethers.utils.formatEther(ownerSupply)}`,
      );

      await waterToken.transfer(signers[3].address, toWei(150));

      await waterToken.transfer(signers[5].address, toWei(1500));
    });

    it('Testing Irrigation transferFrom & approval', async () => {
      const addr3 = signers[3].address;
      const addr4 = signers[4].address;
      await waterToken.connect(signers[3]).approve(owner, toWei(50));

      await expect(
        waterToken.connect(signers[4]).transferFrom(addr3, owner, toWei(50)),
      ).to.eventually.be.rejectedWith(Error, /ERC20: insufficient allowance/);

      await waterToken.transferFrom(addr3, addr4, toWei(25));
      await waterToken.transferFrom(addr3, owner, toWei(25));

      await expect(waterToken.transferFrom(addr3, owner, toWei(1))).to.eventually.be.rejectedWith(
        Error,
        /ERC20: insufficient allowance/,
      );
    });

    it('Testing WaterToken max approval and then transferFrom', async () => {
      const addr5 = signers[5].address;
      const addr6 = signers[6].address;

      await waterToken.connect(signers[5]).approve(owner, ethers.constants.MaxUint256);

      await waterToken.transferFrom(addr5, addr6, toWei(150));

      const gdAddr5Supply = await waterToken.balanceOf(addr5);
      assert(
        gdAddr5Supply.eq(toWei(1350)),
        `Addr5 balanceOf should be = 1350, but is ${ethers.utils.formatEther(gdAddr5Supply)}`,
      );

      await waterToken.connect(signers[5]).approve(owner, ethers.constants.Zero);
      await expect(
        waterToken.transferFrom(addr5, addr6, toWei(1350)),
      ).to.eventually.be.rejectedWith(Error, /ERC20: insufficient allowance/);
    });
  });
}
