import { ethers } from 'hardhat';
import { dc, assert, expect, toWei } from '../../scripts/common';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import {
  AuctionUpgradeable,
  IOracleUpgradeable,
  MockERC20Upgradeable,
  MockPriceOracle,
} from '../../typechain-types';

export function suite() {
  describe('Irrigation Auction Testing', async function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let gdAddr1: IrrigationDiamond;
    let gdOwner: IrrigationDiamond;
    const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
    let token1: MockERC20Upgradeable;
    let token2: MockERC20Upgradeable;
    let dai: MockERC20Upgradeable;
    let sender: SignerWithAddress;
    let auctionContract: AuctionUpgradeable;

    before(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      sender = signers[1];
      const mockTokenContract = await ethers.getContractFactory('MockERC20Upgradeable');
      token1 = await mockTokenContract.deploy();
      await token1.Token_Initialize('Bean', 'BEAN', toWei(100_000_000));
      token2 = await mockTokenContract.deploy();
      await token2.Token_Initialize('Stalk', 'STALK', toWei(100_000_000));
      dai = await mockTokenContract.deploy();
      await dai.Token_Initialize('DAI', 'DAI Stable', toWei(100_000_000));
      sender = signers[1];
      gdOwner = await irrigationDiamond.connect(owner);
      gdAddr1 = await irrigationDiamond.connect(signers[1]);
      auctionContract = await ethers.getContractAt('AuctionUpgradeable', irrigationDiamond.address);
      await auctionContract.setPurchaseToken(dai.address, true);
    });

    it('Testing Auction create', async () => {
      const params = [token1.address, 100, 86400 * 2, toWei(0.1), toWei(0.5)];
      await token1.approve(auctionContract.address, 100);
      const tx = await auctionContract.createAuction(
        0,
        token1.address,
        100,
        50,
        86400 * 2,
        toWei(1),
        toWei(0.1),
        toWei(0.5),
      );
      await expect(tx)
        .to.emit(auctionContract, 'TimedAuctionCreated')
        .withArgs(owner.address, ...params, 1);
      const createdAuction = await auctionContract.getAuction(1);
      assert(
        createdAuction.sellToken === token1.address && createdAuction.seller === owner.address,
        `Incorrect created auction ${createdAuction}`,
      );
    });
  });
}
