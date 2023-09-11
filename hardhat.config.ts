import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-diamond-abi';
import 'hardhat-abi-exporter';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomiclabs/hardhat-ethers';
import '@foundry-rs/hardhat-anvil';
import '@nomiclabs/hardhat-web3';
import { CONTRACT_ADDRESSES } from './scripts/shared';
import { getPriceOfPods } from './test/utils/price';
import { deployments } from './scripts/deployments';
import { fromWei, toBN, toWei } from './scripts/common';
import { restorePlots } from './test/utils/restorePlot';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('podIndex', 'Prints podIndex and harvestableIndex', async (taskArgs, hre) => {
  const podContract = await hre.ethers.getContractAt(
    'IBeanstalkUpgradeable',
    CONTRACT_ADDRESSES.BEANSTALK,
  );
  console.log('blockNumber:', await hre.ethers.provider.getBlockNumber());
  console.log(
    'podIndex:',
    (await podContract.podIndex()).toNumber(),
    'harvestable:',
    (await podContract.harvestableIndex()).toNumber(),
  );
});

task('podsPrice', 'Prints calculated pods price', async (taskArgs: any, hre) => {
  const podContract = await hre.ethers.getContractAt(
    'IBeanstalkUpgradeable',
    CONTRACT_ADDRESSES.BEANSTALK,
  );
  console.log('blockNumber:', await hre.ethers.provider.getBlockNumber());
  const podIndex = await podContract.podIndex();
  const harvestableIndex = await podContract.harvestableIndex();
  console.log('podIndex:', podIndex.toNumber(), 'harvestable:', harvestableIndex.toNumber());
  console.log(
    'pods price:',
    getPriceOfPods(
      toBN(taskArgs?.podindex),
      toBN(taskArgs?.pods),
      podIndex,
      harvestableIndex,
    ).toString(),
  );
})
  .addParam('podindex')
  .addParam('pods');

task('rewards', 'Prints rewards on Water Tower', async (taskArgs, hre) => {
  const waterTowerContract = await hre.ethers.getContractAt(
    'WaterTowerUpgradeable',
    deployments[hre.network.name].DiamondAddress,
  );
  console.log('totalRewards in WaterTower:', fromWei(await waterTowerContract.getTotalRewards()));
  const lastPool = await waterTowerContract.getPoolInfo(
    (await waterTowerContract.getPoolIndex()).sub(1),
  );
  console.log('last monthly Rewards in WaterTower:', fromWei(lastPool.monthlyRewards));
});

task('update-rewards', 'Update monthly rewards on Water Tower', async (taskArgs: any, hre) => {
  const waterTowerContract = await hre.ethers.getContractAt(
    'WaterTowerUpgradeable',
    deployments[hre.network.name].DiamondAddress,
  );
  const curTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;
  let date = new Date(curTimestamp * 1000);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  await waterTowerContract.setPool(Math.floor(date.getTime() / 1000), toWei(taskArgs?.monthly));
  console.log('totalRewards in WaterTower:', fromWei(await waterTowerContract.getTotalRewards()));
  const lastPool = await waterTowerContract.getPoolInfo(
    (await waterTowerContract.getPoolIndex()).sub(1),
  );
  console.log('last monthly Rewards in WaterTower:', fromWei(lastPool.monthlyRewards));
}).addParam('monthly');

task('sync-devchain', 'Syncing dev chain', async (taskArgs, hre) => {
  if (hre.network.name !== 'dev') {
    console.log('Support syncing for dev chain');
    return;
  }
  const curTime = Math.floor(Date.now() / 1000);
  console.log('Current time:', new Date(curTime * 1000));
  await hre.ethers.provider.send('evm_mine', []);
  const curBlockTime = (await hre.ethers.provider.getBlock('latest')).timestamp;
  if (curTime > 5 + curBlockTime) {
    await hre.ethers.provider.send('evm_setNextBlockTimestamp', [curTime]);
    await hre.ethers.provider.send('evm_mine', []);
    console.log(
      'Updated block timestamp:',
      new Date((await hre.ethers.provider.getBlock('latest')).timestamp * 1000),
    );
  } else {
    console.log('Already synced');
  }
});

task('sync-plots-beta', 'Testers get own plots on devchain', async (taskArgs, hre) => {
  await restorePlots(hre);
});
const elementSeenSet = new Set<string>();
// filter out duplicate function signatures
function genSignature(name: string, inputs: Array<any>, type: string): string {
  return `${type} ${name}(${inputs.reduce((previous, key) => {
    const comma = previous.length ? ',' : '';
    return previous + comma + key.internalType;
  }, '')})`;
}

function filterDuplicateFunctions(
  abiElement: any,
  index: number,
  fullAbiL: any[],
  fullyQualifiedName: string,
) {
  if (['function', 'event'].includes(abiElement.type)) {
    const funcSignature = genSignature(abiElement.name, abiElement.inputs, abiElement.type);
    if (elementSeenSet.has(funcSignature)) {
      return false;
    }
    elementSeenSet.add(funcSignature);
  } else if (abiElement.type === 'fallback') {
    if (!fullyQualifiedName.match('IrrigationDiamond.sol')) {
      return false;
    }
  } else if (abiElement.type === 'event') {
  }

  return true;
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      metadata: {
        bytecodeHash: 'none',
      },
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      forking: process.env.FORK_URL
        ? {
            url: process.env.FORK_URL,
            blockNumber: parseInt(process.env.FORK_BLOCK_NUMBER) || undefined,
          }
        : undefined,
      // chainId: 1337,
      hardfork: 'london',
    },
    local: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    dev: {
      url: process.env.DEV_RPC || '',
      chainId: 31337,
    },
    anvil: {
      url: 'http://localhost:8545',
      forking: process.env.FORK_URL
        ? {
            url: process.env.FORK_URL,
            blockNumber: parseInt(process.env.FORK_BLOCK_NUMBER) || undefined,
          }
        : undefined,
      chainId: 31337,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}` || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 100000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : '',
      polygonMumbai:
        process.env.POLYGONSCAN_API_KEY !== undefined ? process.env.POLYGONSCAN_API_KEY : '',
      polygon: process.env.POLYGONSCAN_API_KEY !== undefined ? process.env.POLYGONSCAN_API_KEY : '',
    },
  },
  abiExporter: {
    flat: true,
    spacing: 2,
    pretty: true,
  },
  diamondAbi: {
    name: 'IrrigationDiamond',
    strict: false,
    exclude: ['hardhat-diamond-abi/.*'],
    filter: filterDuplicateFunctions,
  },
  mocha: {
    timeout: 0,
  },
};

export default config;
