import { ethers } from "hardhat";
import { dc, toWei } from "../scripts/common";
import { assert, expect } from "./utils/debug";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IrrigationDiamond } from "../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol";
import { IERC20Upgradeable__factory } from "../typechain-types/";
import { getInterfaceID } from "../scripts/FacetSelectors";

const NAME = 'Water Token';
const SYMBOL = 'WATER';
const DECIMALS = 18;

export function suite() {
  describe("Irrigation ERC20 Testing", async function () {
    let signers: SignerWithAddress[];
    let owner: string;
    let gdAddr1: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0].address;
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
    })

    it("Testing Irrigation ERC20 interface is supported", async () => {
      const IERC20UpgradeableInterface = IERC20Upgradeable__factory.createInterface();
      // interface ID does not include base contract(s) functions.
      const IERC20InterfaceID = getInterfaceID(IERC20UpgradeableInterface);
      assert(await irrigationDiamond.supportsInterface(IERC20InterfaceID._hex), "Doesn't support IERC20Upgradeable");
    });

    it("Test Water ERC20 token name, symbol, and decimals", async () => {
      const waterToken = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      expect(await waterToken.name()).to.be.equal(NAME);
      expect(await waterToken.symbol()).to.be.equal(SYMBOL);
      expect(await waterToken.decimals()).to.be.eq(DECIMALS);
    }
    )
    it("Testing Irrigation ERC20 transfer", async () => {
      const waterSupply = await irrigationDiamond["totalSupply()"]();
      assert(waterSupply.eq(toWei(100000000)), `Irrigation Supply should be 100000000, but is ${ethers.utils.formatEther(waterSupply)}`);

      const ownerSupply = await irrigationDiamond["balanceOf(address)"](owner);
      assert(ownerSupply.gt(toWei(100)), `Owner balanceOf should be > 100, but is ${ethers.utils.formatEther(ownerSupply)}`);

      await irrigationDiamond.transfer(signers[3].address, toWei(150));
    });

    it("Testing Irrigation transferFrom & approval", async () => {
      const gdAddr3 = await irrigationDiamond.connect(signers[3]);
      const gdAddr4 = await irrigationDiamond.connect(signers[4]);
      const addr3 = signers[3].address;
      const addr4 = signers[4].address;

      await gdAddr3.approve(owner, toWei(50));

      await expect(gdAddr4.transferFrom(addr3, owner, toWei(50))).to.eventually.be.rejectedWith(Error,
        /ERC20: insufficient allowance/);

      await irrigationDiamond.transferFrom(addr3, addr4, toWei(25));
      await irrigationDiamond.transferFrom(addr3, owner, toWei(25));

      await expect(irrigationDiamond.transferFrom(addr3, owner, toWei(1))).to.eventually.be.rejectedWith(Error,
        /ERC20: insufficient allowance/);

    });
  });
}
