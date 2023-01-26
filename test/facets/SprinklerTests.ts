import { ethers } from "hardhat";
import { dc, assert, expect, toWei } from "../../scripts/common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IrrigationDiamond  } from "../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol";

export function suite () {
  describe("Irrigation Sprintkler Testing", async function () {
    let signers: SignerWithAddress[];
    let owner: string;
    let gdAddr1: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;    
    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0].address;
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
      // const beanstalkContract = await ethers.getContractFactory('MockBeanstalk');
      // const beanstalk = await beanstalkContract.deploy();
    })
    
    it("Testing Sprinkler price oracles", async () => {
      const priceOracleContract = await ethers.getContractFactory('MockPriceOracle');
      const priceOracle1 = await priceOracleContract.deploy();      
      const priceOracle2 = await priceOracleContract.deploy();
      const mockTokenContract = await ethers.getContractFactory('MockERC20');
      const token1 = await mockTokenContract.deploy("Bean","BEAN", 18, 100_000_000 );
      const token2 = await mockTokenContract.deploy("Stalk", "STALK", 18, 100_000_000 );
      await irrigationDiamond["setPriceOracle(address,address)"](token1.address, priceOracle1.address);
      await irrigationDiamond["setPriceOracle(address,address)"](token2.address, priceOracle2.address);
      const priceOracleAddress1 = await irrigationDiamond["priceOracles(address)"](token1.address);
      assert((priceOracleAddress1 === priceOracle1.address), `price oracles is failed ${priceOracleAddress1}`);
      const priceOracleAddress2 = await irrigationDiamond["priceOracles(address)"](token2.address);
      assert((priceOracleAddress2 === priceOracle2.address), `price oracles is failed ${priceOracleAddress2}`);
    });
  });
}
