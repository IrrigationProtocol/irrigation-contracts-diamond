// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { debug } from 'debug';
import { BaseContract, BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import {
  FacetInfo,
  getSelectors,
  getDeployedFuncSelectors,
  FacetCutAction,
} from './FacetSelectors';
import {
  dc,
  INetworkDeployInfo,
  FacetToDeployInfo,
  AfterDeployInit,
  writeDeployedInfo,
  toWei,
} from './common';
import { DiamondCutFacet, IDiamondCut } from '../typechain-types';
import { deployments } from './deployments';
import { Facets, UpgradeInits, LoadFacetDeployments } from './facets';
import * as util from 'util';

const log: debug.Debugger = debug('IrrigationDeploy:log');
log.color = '159';

const GAS_LIMIT_PER_FACET = 20000;
const GAS_LIMIT_CUT_BASE = 70000;

export async function deployIrrigationDiamond(networkDeployInfo: INetworkDeployInfo) {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
  const diamondCutFacet = (await DiamondCutFacet.deploy()) as DiamondCutFacet;
  await diamondCutFacet.deployed();
  log(
    `DiamondCutFacet deployed: ${diamondCutFacet.deployTransaction.hash} tx_hash: ${diamondCutFacet.deployTransaction.hash}`,
  );
  dc.DiamondCutFacet = diamondCutFacet;

  // we use the hash of 'irrigation' instead of random number
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Irrigation'));
  let contractDeployer;
  if (process.env.CONTRACT_DEPLOYER_KEY) {
    contractDeployer = new ethers.Wallet(process.env.CONTRACT_DEPLOYER_KEY).connect(
      contractOwner.provider,
    );
    const ethBalance = await ethers.provider.getBalance(contractDeployer.address);

    if (ethBalance.lt(BigNumber.from(toWei(0.05)))) {
      await contractOwner.sendTransaction({
        to: contractDeployer.address,
        value: ethers.utils.parseEther('0.1'),
        gasLimit: 21000,
      });
    }
  } else {
    contractDeployer = contractOwner;
  }
  // deploy deployer Create3Factory
  const Create3Factory = await ethers.getContractFactory('CREATE3Factory');
  const deployer = await Create3Factory.connect(contractDeployer).deploy();
  log(`Factory address ${deployer.address}`);
  networkDeployInfo.FactoryAddress = deployer.address;
  await deployer.deployed();
  // deploy Diamond
  const Diamond = await ethers.getContractFactory(
    'contracts/IrrigationDiamond.sol:IrrigationDiamond',
  );
  const constructCode = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address'],
    [contractOwner.address, diamondCutFacet.address],
  );
  await deployer.connect(contractOwner).deploy(salt, Diamond.bytecode, constructCode, { value: 0 });
  const irrigationDiamondAddress = await deployer.getDeployed(contractOwner.address, salt);
  log(
    `salt: ${salt}, owner: ${contractOwner.address}, main contract: ${irrigationDiamondAddress} `,
  );
  const irrigationDiamond = await ethers.getContractAt(
    'contracts/IrrigationDiamond.sol:IrrigationDiamond',
    irrigationDiamondAddress,
  );
  dc._IrrigationDiamond = irrigationDiamond;
  networkDeployInfo.DiamondAddress = irrigationDiamondAddress;

  dc.IrrigationDiamond = (
    await ethers.getContractFactory('hardhat-diamond-abi/HardhatDiamondABI.sol:IrrigationDiamond')
  ).attach(irrigationDiamond.address);

  // update deployed info for DiamondCutFacet since Diamond contract constructor already adds DiamondCutFacet::diamondCut
  networkDeployInfo.FacetDeployedInfo.DiamondCutFacet = {
    address: diamondCutFacet.address,
    tx_hash: diamondCutFacet.deployTransaction.hash,
    version: 0.0,
    funcSelectors: [
      diamondCutFacet.interface.getSighash('diamondCut((address,uint8,bytes4[])[],address,bytes)'),
    ],
  };

  log(`Diamond deployed ${irrigationDiamond.address}`);
}

export async function deployFuncSelectors(
  networkDeployInfo: INetworkDeployInfo,
  oldNetworkDeployInfo: INetworkDeployInfo,
  facetsToDeploy: FacetToDeployInfo = Facets,
) {
  const cut: FacetInfo[] = [];
  const deployedFacets = networkDeployInfo.FacetDeployedInfo;
  const deployedFuncSelectors = await getDeployedFuncSelectors(oldNetworkDeployInfo);
  const registeredFunctionSignatures = new Set<string>();

  const facetsPriority = Object.keys(facetsToDeploy).sort(
    (a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority,
  );
  let protocolUpgradeVersion = 0;
  for (const name of facetsPriority) {
    const facetDeployVersionInfo = facetsToDeploy[name];
    let facetVersions = ['0.0'];
    // sort version high to low
    if (facetDeployVersionInfo.versions) {
      facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
    }

    const upgradeVersion = +facetVersions[0];
    protocolUpgradeVersion = Math.max(upgradeVersion, protocolUpgradeVersion);
    const facetDeployInfo = facetDeployVersionInfo.versions
      ? facetDeployVersionInfo.versions[upgradeVersion]
      : {};

    const deployedVersion =
      deployedFacets[name]?.version ?? (deployedFacets[name]?.tx_hash ? 0.0 : -1.0);

    const externalLibraries = {};
    Object.keys(networkDeployInfo.ExternalLibraries)?.forEach((libraryName: string) => {
      if (facetDeployVersionInfo.libraries?.includes(libraryName))
        externalLibraries[libraryName] = networkDeployInfo.ExternalLibraries[libraryName];
    });
    const FacetContract = await ethers.getContractFactory(
      name,
      facetDeployVersionInfo.libraries ? { libraries: externalLibraries } : undefined,
    );

    const facet = FacetContract.attach(deployedFacets[name].address!);

    const facetNeedsUpgrade =
      !(name in deployedFuncSelectors.contractFacets) || upgradeVersion !== deployedVersion;
    dc[name] = facet;

    const origSelectors = getSelectors(facet).values;
    const newFuncSelectors =
      facetDeployInfo.deployInclude ?? getSelectors(facet, registeredFunctionSignatures).values;
    const removedSelectors = origSelectors.filter((v) => !newFuncSelectors.includes(v));
    if (removedSelectors.length) {
      log(`${name} removed ${removedSelectors.length} selectors: [${removedSelectors}]`);
    }

    let numFuncSelectorsCut = 0;
    // remove any function selectors from this facet that were previously deployed but no longer exist
    const deployedContractFacetsSelectors = deployedFuncSelectors.contractFacets[name];
    const deployedToRemove =
      deployedContractFacetsSelectors?.filter((v) => !newFuncSelectors.includes(v)) ?? [];
    // removing any previous deployed function selectors that were removed from this contract
    if (deployedToRemove.length) {
      cut.unshift({
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: deployedToRemove,
        name: name,
      });
      numFuncSelectorsCut++;
    }

    if (newFuncSelectors.length) {
      const initFunc = facetDeployInfo.init;
      deployedFacets[name].funcSelectors = newFuncSelectors;
      const replaceFuncSelectors: string[] = [];
      const addFuncSelectors = newFuncSelectors.filter((v) => {
        if (v in deployedFuncSelectors.facets) {
          if (deployedFuncSelectors.facets[v].toLowerCase() !== facet.address.toLowerCase()) {
            replaceFuncSelectors.push(v);
          }
          return false;
        } else {
          return true;
        }
      });

      if (replaceFuncSelectors.length) {
        cut.push({
          facetAddress: facet.address,
          action: FacetCutAction.Replace,
          functionSelectors: replaceFuncSelectors,
          name: name,
        });
        numFuncSelectorsCut++;
      }

      if (addFuncSelectors.length) {
        cut.push({
          facetAddress: facet.address,
          action: FacetCutAction.Add,
          functionSelectors: addFuncSelectors,
          name: name,
        });
        numFuncSelectorsCut++;
      }

      // add new registered function selector strings
      for (const funcSelector of newFuncSelectors) {
        registeredFunctionSignatures.add(funcSelector);
      }

      deployedFacets[name].funcSelectors = newFuncSelectors;
      deployedFacets[name].version = upgradeVersion;
    } else {
      delete deployedFuncSelectors.contractFacets[name];
      log(`Pruned all selectors from ${name}`);
    }

    if (numFuncSelectorsCut === 0) {
      log(
        `*** Skipping ${name} as there were no modifications to deployed facet function selectors`,
      );
    }
  }

  // upgrade diamond with facets
  log('Protocol upgrade version: ', protocolUpgradeVersion);
  log('Diamond Cut:', cut);
  let diamondCut = dc.IrrigationDiamond as IDiamondCut;
  // when upgrading, gets DiamondCutFacet interface from address
  if (!diamondCut)
    diamondCut = await ethers.getContractAt('DiamondCutFacet', networkDeployInfo.DiamondAddress);

  let functionCall: any = [];
  let initAddress = ethers.constants.AddressZero;
  if (UpgradeInits[protocolUpgradeVersion]) {
    const upgradeInitInfo = UpgradeInits[protocolUpgradeVersion];
    const initContractFactory: any = await ethers.getContractFactory(
      upgradeInitInfo.initContractName,
    );
    const initContract = await initContractFactory.deploy();
    await initContract.deployed();
    if (!upgradeInitInfo.initArgs) {
      functionCall = initContract.interface.encodeFunctionData(upgradeInitInfo.initFuncName);
    } else
      functionCall = initContract.interface.encodeFunctionData(
        upgradeInitInfo.initFuncName,
        upgradeInitInfo.initArgs,
      );
    initAddress = initContract.address;
    log(`Calling Function:`, upgradeInitInfo);
  }

  try {
    let totalSelectors = 0;
    cut.forEach((e) => {
      totalSelectors += e.functionSelectors.length;
    });
    const tx = await diamondCut.diamondCut(cut, initAddress, functionCall, {
      gasLimit: GAS_LIMIT_CUT_BASE + totalSelectors * GAS_LIMIT_PER_FACET,
    });

    log(`Diamond cut: tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade was failed: ${tx.hash}`);
    }
  } catch (e) {
    log(`unable to cut facet: \n ${e}`);
  }
  for (const facetCutInfo of cut) {
    for (const facetModified of facetCutInfo.functionSelectors) {
      switch (facetCutInfo.action) {
        case FacetCutAction.Add:
        case FacetCutAction.Replace:
          deployedFuncSelectors.facets[facetModified] = facetCutInfo.facetAddress;
          break;
        case FacetCutAction.Remove:
          delete deployedFuncSelectors.facets[facetModified];
          break;
      }
    }
  }

  log('Diamond Facets cuts completed');
}

export async function afterDeployCallbacks(
  networkDeployInfo: INetworkDeployInfo,
  facetsToDeploy: FacetToDeployInfo = Facets,
) {
  const facetsPriority = Object.keys(facetsToDeploy).sort(
    (a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority,
  );
  for (const name of facetsPriority) {
    const facetDeployVersionInfo = facetsToDeploy[name];
    let facetVersions = ['0.0'];
    // sort version high to low
    if (facetDeployVersionInfo.versions) {
      facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
    }

    const upgradeVersion = +facetVersions[0];
    const facetDeployInfo = facetDeployVersionInfo.versions
      ? facetDeployVersionInfo.versions[upgradeVersion]
      : {};
    if (facetDeployInfo.callback) {
      const afterDeployCallback = facetDeployInfo.callback;
      try {
        await afterDeployCallback(networkDeployInfo);
      } catch (e) {
        log(`Failure in after deploy callbacks for ${name}: \n${e}`);
      }
    }
  }
}

export async function deployAndInitDiamondFacets(
  networkDeployInfo: INetworkDeployInfo,
  facetsToDeploy: FacetToDeployInfo = Facets,
) {
  const deployInfoBeforeUpgraded: INetworkDeployInfo = JSON.parse(
    JSON.stringify(networkDeployInfo),
  );
  await deployDiamondFacets(networkDeployInfo, facetsToDeploy);
  const deployInfoWithOldFacet: INetworkDeployInfo = Object.assign(
    JSON.parse(JSON.stringify(networkDeployInfo)),
  );
  for (const key in deployInfoWithOldFacet.FacetDeployedInfo) {
    if (deployInfoBeforeUpgraded.FacetDeployedInfo[key])
      deployInfoWithOldFacet.FacetDeployedInfo[key] =
        deployInfoBeforeUpgraded.FacetDeployedInfo[key];
  }
  await deployFuncSelectors(networkDeployInfo, deployInfoWithOldFacet, facetsToDeploy);
  await afterDeployCallbacks(networkDeployInfo, facetsToDeploy);
}

export async function deployExternalLibraries(networkDeployedInfo: INetworkDeployInfo) {
  const uniswapV3TwapContract = await ethers.getContractFactory('UniswapV3Twap');
  const uniswapV3Twap = await uniswapV3TwapContract.deploy();
  networkDeployedInfo.ExternalLibraries = {};
  networkDeployedInfo.ExternalLibraries['UniswapV3Twap'] = uniswapV3Twap.address;
  /**
   * @dev we don't deploy zk utility contracts in version 1.0
   */
  // const innerVerifierContract = await ethers.getContractFactory('InnerVerifier');
  // const innerVerifier = await innerVerifierContract.deploy();
  // const burnVerifierContract = await ethers.getContractFactory('BurnVerifier', {
  //   libraries: {
  //     InnerVerifier: innerVerifier.address,
  //   },
  // });
  // const burnVerifier = await burnVerifierContract.deploy();
  // const zetherVerifierContract = await ethers.getContractFactory('ZetherVerifier', {
  //   libraries: {
  //     InnerVerifier: innerVerifier.address,
  //   },
  // });
  // const zetherVerifier = await zetherVerifierContract.deploy();
  // const LibEncryptionContract = await ethers.getContractFactory('libEncryption');
  // const libEncryption = await LibEncryptionContract.deploy();

  // networkDeployedInfo.ExternalLibraries['BurnVerifier'] = burnVerifier.address;
  // networkDeployedInfo.ExternalLibraries['ZetherVerifier'] = zetherVerifier.address;
  // networkDeployedInfo.ExternalLibraries['libEncryption'] = libEncryption.address;
}

export async function deployDiamondFacets(
  networkDeployInfo: INetworkDeployInfo,
  facetsToDeploy: FacetToDeployInfo = Facets,
) {
  // deploy facets
  log('');
  log('Deploying facets');
  const deployedFacets = networkDeployInfo.FacetDeployedInfo;

  const facetsPriority = Object.keys(facetsToDeploy).sort(
    (a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority,
  );
  for (const name of facetsPriority) {
    const facetDeployVersionInfo = facetsToDeploy[name];
    let facet: BaseContract;
    let facetVersions = ['0.0'];
    // sort version high to low, could be used for future upgrading from version X to version Y
    if (facetDeployVersionInfo.versions) {
      facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
    }

    const upgradeVersion = +facetVersions[0];

    const deployedVersion =
      deployedFacets[name]?.version ?? (deployedFacets[name]?.tx_hash ? 0.0 : -1.0);
    const facetNeedsDeployment = !(name in deployedFacets) || deployedVersion != upgradeVersion;

    const externalLibraries = {};
    Object.keys(networkDeployInfo.ExternalLibraries)?.forEach((libraryName: string) => {
      if (facetDeployVersionInfo.libraries?.includes(libraryName))
        externalLibraries[libraryName] = networkDeployInfo.ExternalLibraries[libraryName];
    });
    const FacetContract = await ethers.getContractFactory(
      name,
      facetDeployVersionInfo.libraries
        ? {
            libraries: externalLibraries,
          }
        : undefined,
    );

    if (facetNeedsDeployment) {
      log(`Deploying ${name} size: ${FacetContract.bytecode.length}`);
      try {
        facet = await FacetContract.deploy();
        await facet.deployed();
      } catch (e) {
        log(`Unable to deploy, continuing: ${e}`);
        continue;
      }
      deployedFacets[name] = {
        address: facet.address,
        tx_hash: facet.deployTransaction.hash,
        version: deployedVersion,
      };
      log(`${name} deployed: ${facet.address} tx_hash: ${facet.deployTransaction.hash}`);
    }
  }
  log('Completed Facet deployments\n');
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  if (require.main === module) {
    debug.enable('Irrigation.*:log');
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
    const networkDeployedInfo = deployments[networkName];
    await deployIrrigationDiamond(networkDeployedInfo);

    log(`Contract address deployed is ${networkDeployedInfo.DiamondAddress}`);
    await deployExternalLibraries(networkDeployedInfo);

    await deployAndInitDiamondFacets(networkDeployedInfo);
    log(
      `Facets deployed to: ${
        (util.inspect(networkDeployedInfo.FacetDeployedInfo), { depth: null })
      }`,
    );
    if (networkName !== 'hardhat') writeDeployedInfo(deployments);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
