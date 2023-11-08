import { ContractTransaction } from 'ethers';
import hre, { ethers } from 'hardhat';
import { getSelectors } from '../scripts/FacetSelectors';
import {
  afterDeployCallbacks,
  deployAndInitDiamondFacets,
  deployDiamondFacets,
  deployExternalLibraries,
  deployFuncSelectors,
  deployIrrigationDiamond,
} from '../scripts/deploy';
import { IrrigationDiamond } from '../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { dc, INetworkDeployInfo, toWei } from '../scripts/common';
import { debuglog, assert } from './utils/debug';

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
import * as IrrigationControlTests from './IrrigationControlTests';
import { initForTest, updateOwnerForTest } from '../scripts/init';
import { GetUpdatedFacets, attachIrrigationDiamond } from '../scripts/upgrade';
import { impersonateSigner, setEtherBalance } from './utils/signer';
import { DiamondLoupeFacet } from '../typechain-types';

const debugging = process.env.JB_IDE_HOST !== undefined;

if (!process.env.FORK_URL) {
  console.log('Unit test is supported only on chain forked from mainnet');
  process.exit(0);
}

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

    const deployer = (await ethers.getSigners())[0];

    const networkName = hre.network.name;
    if (networkName in deployments) {
      networkDeployedInfo = deployments[networkName];
      await LoadFacetDeployments();
      const updatedFacetsToDeploy = await GetUpdatedFacets(networkDeployedInfo.FacetDeployedInfo);
      debuglog(util.inspect(updatedFacetsToDeploy));
      await attachIrrigationDiamond(networkDeployedInfo);
      // transfer ownership to first test account
      const oldOwnerAddress = await updateOwnerForTest(networkDeployedInfo.DiamondAddress);
      await deployAndInitDiamondFacets(networkDeployedInfo, updatedFacetsToDeploy);
      debuglog(`Contract address deployed is ${networkDeployedInfo.DiamondAddress}`);
      irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
      debuglog(`${util.inspect(networkDeployedInfo, { depth: null })}`);
      debuglog('Facets Deployed');
      await initForTest(networkDeployedInfo.DiamondAddress, oldOwnerAddress);
    } else {
      debuglog(`No deployments found to attach to for ${networkName}, aborting.`);
    }
  });

  describe('Facet Cut Testing', async function () {
    let result;
    const addresses: any[] = [];

    it('should have same count of facets -- call to facetAddresses function', async () => {
      const facetAddresses = await irrigationDiamond.facetAddresses();
      for (const facetAddress of facetAddresses) {
        addresses.push(facetAddress);
      }
      const deployedFacetAddresses: any[] = [];
      for (const deployedFacetName in networkDeployedInfo.FacetDeployedInfo) {
        deployedFacetAddresses.push(
          networkDeployedInfo.FacetDeployedInfo[deployedFacetName].address,
        );
      }
      // DiamondCutFacet is deployed but doesn't have any facets deployed
      assert.equal(addresses.length, Object.keys(networkDeployedInfo.FacetDeployedInfo).length);
    });

    it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
      let selectors = getSelectors(dc.DiamondCutFacet);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[0]);
      assert.sameMembers(result, selectors.values);
      const registeredSelectors = new Set<string>();
      result.forEach((e: string) => registeredSelectors.add(e));
      selectors = getSelectors(dc.DiamondLoupeFacet, registeredSelectors);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[1]);
      assert.sameMembers(result, selectors.values);
      result.forEach((e: string) => registeredSelectors.add(e));
      selectors = getSelectors(dc.OwnershipFacet, registeredSelectors);
      result = await irrigationDiamond.facetFunctionSelectors(addresses[2]);
      assert.sameMembers(result, selectors.values);
    });

    after(() => {
      // admin control
      IrrigationControlTests.suite();
      /// oracle facet
      PriceOracleTests.suite(networkDeployedInfo);
      PodsOracleTests.suite();
      /// utility token facet
      IrrigationERC20Tests.suite();
      /// core facets
      SprinklerTests.suite();
      WaterTowerTests.suite();
      AuctionTests.suite();
      TrancheTests.suite();
      // WaterFaucetTests.suite();
      // ZscTests.suite();
    });
  });
});
