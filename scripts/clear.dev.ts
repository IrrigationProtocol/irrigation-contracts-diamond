/**
 * @title After we deploy contracts, initialize contracts by making whitelist on sprinkler, auctions, farmer's market
 *        And, on develop chain, we will deploy mock tokens for testing
 *        Initialization is required one time only
 */
import { debug } from 'debug';
import fs from 'fs';
import util from 'util';

import tokenData from '../test/mockTokens.json';
import { deployments } from './deployments';
import { INetworkDeployInfo } from './common';

const log: debug.Debugger = debug('IrrigationDeploy:log');
log.color = '159';

const networkName = process?.argv?.[2] || 'dev';

async function clearMockTokens() {
  for (const token of tokenData) {
    if (token.addresses?.[networkName]) {
      delete token.addresses[networkName];
    }
    if (token.priceOracles?.[networkName]) {
      delete token.priceOracles[networkName];
    }
  }
  fs.writeFileSync(`test/mockTokens.json`, JSON.stringify(tokenData, null, 4));
}

async function deletDeployedInfo(deployments: { [key: string]: INetworkDeployInfo }) {
  fs.writeFileSync(
    'scripts/deployments.ts',
    `\nimport { INetworkDeployInfo } from "../scripts/common";\n` +
      `export const deployments: { [key: string]: INetworkDeployInfo } = ${util.inspect(
        deployments,
        { depth: null },
      )};\n`,
    'utf8',
  );
}

async function main() {
  if (require.main === module) {
    debug.enable('Irrigation.*:log');
  }
  log(`clearing cache data for dev chain`);
  log(`--- clearing mock tokens addresses.`);
  await clearMockTokens();
  /**
   * delete deployed addreses
   */
  delete deployments[networkName];
  log(`--- clearing deployed diamond root and facet addresses.`);
  await deletDeployedInfo(deployments);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
