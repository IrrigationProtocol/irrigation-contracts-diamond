import { ContractTransaction } from 'ethers';
import hre, { ethers } from 'hardhat';
import { getSelectors } from '../scripts/FacetSelectors';
import {
  afterDeployCallbacks,
  deployDiamondFacets,
  deployExternalLibraries,
  deployFuncSelectors,
  deployIrrigationDiamond,
} from '../scripts/deploy';
import { IrrigationDiamond } from '../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { dc, debuglog, assert, INetworkDeployInfo } from '../scripts/common';
import { LoadFacetDeployments } from '../scripts/facets';
import { deployments } from '../scripts/deployments';
import util from 'util';
import { debug } from 'debug';

// other files suites to execute
import * as IrrigationERC20Tests from './IrrigationERC20Tests';
// suites for facets
import * as SprinklerTests from './facets/SprinklerTests';
import * as WaterFaucetTests from './facets/WaterFaucetTests';
import * as WaterTowerTests from './facets/WaterTowerTests';
import * as AuctionTests from './facets/AuctionTests';
import * as ZscTests from './facets/ZscTests';
import * as PodsOracleTests from './PodsOracleTests';
import * as TrancheTests from './facets/TrancheTests';
import * as PriceOracleTests from './facets/PriceOracleTests';
import { mintAllTokensForTesting } from './utils/mint';
import { initAll } from '../scripts/init';

const debugging = process.env.JB_IDE_HOST !== undefined;

export async function logEvents(tx: ContractTransaction) {
  const receipt = await tx.wait();

  if (receipt.events) {
    for (const event of receipt.events) {
      debuglog(`Event ${event.event} with args ${event.args}`);
    }
  }
}

describe.only('Irrigation Diamond DApp Testing', async function () {
  let irrigationDiamond: IrrigationDiamond;
  let networkDeployedInfo: INetworkDeployInfo;
  global.curTime = Date.now();
  if (debugging) {
    debug.enable('Irrigation.*:log');
    debuglog.enabled = true;
    debuglog.log = console.log.bind(console);
    debuglog(
      'Disabling timeout, enabling debuglog, because code was run in Jet Brains (probably debugging)',
    );
    this.timeout(0);
  }

  before(async function () {
    await LoadFacetDeployments();

    const deployer = (await ethers.getSigners())[0].address;

    const networkName = hre.network.name;
    if (!deployments[networkName]) {
      deployments[networkName] = {
        DiamondAddress: '',
        DeployerAddress: deployer,
        FacetDeployedInfo: {},
      };
    }
    networkDeployedInfo = deployments[networkName];

    await deployIrrigationDiamond(networkDeployedInfo);

    irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;

    debuglog('Diamond Deployed');
    await deployExternalLibraries(networkDeployedInfo);
    // do deployment of facets in 3 steps
    await deployDiamondFacets(networkDeployedInfo);
    debuglog(`${util.inspect(networkDeployedInfo, { depth: null })}`);
    await deployFuncSelectors(networkDeployedInfo);
    debuglog(`${util.inspect(networkDeployedInfo, { depth: null })}`);

    // this should be a null operation.
    await deployFuncSelectors(networkDeployedInfo);

    await afterDeployCallbacks(networkDeployedInfo);
    debuglog(`${util.inspect(networkDeployedInfo, { depth: null })}`);
    debuglog('Facets Deployed');
    debuglog('Minting tokens');
    await mintAllTokensForTesting(deployer);
    await initAll(irrigationDiamond.address);
  });

  describe('Facet Cut Testing', async function () {
    let tx;
    let receipt;
    let result;
    const addresses: any[] = [];

    it('should have same count of facets -- call to facetAddresses function', async () => {
      const facetAddresses = await irrigationDiamond.facetAddresses();
      for (const facetAddress of facetAddresses) {
        addresses.push(facetAddress);
      }
      // DiamondCutFacet is deployed but doesn't have any facets deployed
      assert.equal(addresses.length, Object.keys(networkDeployedInfo.FacetDeployedInfo).length);
    });

    it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
      let selectors = getSelectors(dc.DiamondCutFacet);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[0]);
      assert.sameMembers(result, selectors.values);
      selectors = getSelectors(dc.DiamondLoupeFacet);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[1]);
      assert.sameMembers(result, selectors.values);
      selectors = getSelectors(dc.OwnershipFacet);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[2]);
      assert.sameMembers(result, selectors.values);
    });

    after(() => {
      PriceOracleTests.suite(networkDeployedInfo);
      IrrigationERC20Tests.suite();      
      SprinklerTests.suite();      
      WaterTowerTests.suite();
      AuctionTests.suite();
      PodsOracleTests.suite();
      TrancheTests.suite();
      // WaterFaucetTests.suite();
      // ZscTests.suite();
    });
  });
});
