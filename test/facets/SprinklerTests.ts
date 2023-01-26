import { ethers } from "hardhat";
import { dc, assert, expect, toWei } from "../../scripts/common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IrrigationDiamond  } from "../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol";
import { IERC20, IOracleUpgradeable, MockPriceOracle } from "../../typechain-types";

export function suite () {
  describe("Irrigation Sprintkler Testing", async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let gdAddr1: IrrigationDiamond;
    let gdOwner: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: IERC20;
    let token2: IERC20;
    let sender: SignerWithAddress;
    let priceOracle1: MockPriceOracle;
    let priceOracle2: IOracleUpgradeable;
    let priceOracleForWater: MockPriceOracle;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      const mockTokenContract = await ethers.getContractFactory('MockERC20');
      token1 = await mockTokenContract.deploy("Bean","BEAN", 18, 100_000_000 );
      token2 = await mockTokenContract.deploy("Stalk", "STALK", 18, 100_000_000 );
      sender = signers[1];
      gdOwner = await irrigationDiamond.connect(owner);
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
      const priceOracleContract = await ethers.getContractFactory('MockPriceOracle');
      priceOracle1 = await priceOracleContract.deploy();
      priceOracle2 = await priceOracleContract.deploy();
      priceOracleForWater = await priceOracleContract.deploy();
    });
    
    it("Testing Sprinkler price oracles", async () => {
      await irrigationDiamond["setPriceOracle(address,address)"](token1.address, priceOracle1.address);
      await irrigationDiamond["setPriceOracle(address,address)"](token2.address, priceOracle2.address);
      const priceOracleAddress1 = await irrigationDiamond["priceOracles(address)"](token1.address);
      assert((priceOracleAddress1 === priceOracle1.address), `price oracles is failed ${priceOracleAddress1}`);
      const priceOracleAddress2 = await irrigationDiamond["priceOracles(address)"](token2.address);
      assert((priceOracleAddress2 === priceOracle2.address), `price oracles is failed ${priceOracleAddress2}`);
    });

    it("Testing Sprinkler exchange water", async () => {      
      await gdOwner.setTokenMultiplier(token1.address, 2);
      await token1.connect(owner).transfer(sender.address, toWei(100));
      let balance1 = await token1.balanceOf(sender.address);
      const waterToken = await ethers.getContractAt('WaterUpgradeable', irrigationDiamond.address);
      assert(balance1.eq(toWei(100)), `sender balanceOf should be 100, but is ${ethers.utils.formatEther(balance1)}`);

      await waterToken.connect(owner).transfer(irrigationDiamond.address, toWei(10000));
      const waterBalanceOfIrrigation = await waterToken.balanceOf(irrigationDiamond.address);
      assert(waterBalanceOfIrrigation.eq(toWei(10000)), `irrigation balanceOf water should be 10000, but is ${ethers.utils.formatEther(waterBalanceOfIrrigation)}`);

      await gdOwner.setPriceOracle(waterToken.address, priceOracleForWater.address);
      await priceOracleForWater.mockSetPrice(toWei(3));
      await priceOracle1.mockSetPrice(toWei(2));
      await token1.connect(sender).approve(irrigationDiamond.address, toWei(100));
      await gdAddr1.exchangeTokenToWater(token1.address, toWei(100));
      balance1 = await token1.balanceOf(sender.address);
      
      const waterBalance = await waterToken.balanceOf(sender.address);
      assert(balance1.eq(toWei(0)), `Sender balanceOf should be 0, but is ${ethers.utils.formatEther(balance1)}`);
      const token1Price = await priceOracle1.latestPrice();
      const waterPrice = await priceOracleForWater.latestPrice();
      const token1Multiplier = await gdAddr1.tokenMultiplier(token1.address);
      const expectedWaterAmount = toWei(100).mul(token1Price).mul(token1Multiplier).div(waterPrice);      
      assert(expectedWaterAmount.eq(waterBalance), `received water balance is ${ethers.utils.formatEther(waterBalance)}`);      
    });
  });
}
