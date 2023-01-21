import { ethers } from "hardhat";
import { dc, assert, expect, toWei, FERTILIZER_TOKEN_ID } from "../scripts/common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IrrigationDiamond  } from "../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol";
import { IERC20Upgradeable__factory } from "../typechain-types/";
import { getInterfaceID } from "../scripts/FacetSelectors";

export function suite () {
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

    it("Testing Irrigation ERC20 transfer", async () => {
      const gnusSupply = await irrigationDiamond["totalSupply()"]();
      assert(gnusSupply.eq(toWei(4000)), `Irrigation Supply should be 4000, but is ${ethers.utils.formatEther(gnusSupply)}`);

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

      // approve a contract (EscrowAIJob) to receive ERC20 (GNUS), will be lost, but that's OK
      await gdAddr3.setApprovalForAll(owner, true);

      // allow owner to transfer on behalf of addrs in E
      const escrowAIContractAddress = dc.EscrowAIJob.address;
      await expect(irrigationDiamond.safeTransferFrom(addr3, escrowAIContractAddress, FERTILIZER_TOKEN_ID, toWei(1), [])).to.eventually.be.rejectedWith(Error,
        /ERC1155: transfer to non ERC1155Receiver implementer/);

      // remove approval for owner to transfer ERC1155 tokens
      await gdAddr3.setApprovalForAll(owner, false);

      // ERC20 approvate 50 more tokens
      await gdAddr3.approve(owner, toWei(50));

      // this should work, because ERC20 doesn't check ERC1155 interfaces
      await irrigationDiamond.transferFrom(addr3, escrowAIContractAddress, toWei(1));
    });
  });
}
