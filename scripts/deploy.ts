// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { debug } from "debug";
import { BaseContract } from "ethers";
import hre, { ethers } from "hardhat";
import { FacetInfo, getSelectors, getDeployedFuncSelectors, FacetCutAction } from './FacetSelectors';
import { dc, INetworkDeployInfo, FacetToDeployInfo, AfterDeployInit, writeDeployedInfo } from './common';
import { DiamondCutFacet, IDiamondCut } from '../typechain-types';
import { deployments } from './deployments';
import { Facets, LoadFacetDeployments } from './facets';
import * as util from "util";

const log: debug.Debugger = debug("IrrigationDeploy:log");
log.color = "159";

const GAS_LIMIT_PER_FACET = 60000;
const GAS_LIMIT_CUT_BASE = 70000;

export async function deployIrrigationDiamond (networkDeployInfo: INetworkDeployInfo) {
    const accounts = await ethers.getSigners();
    const contractOwner = accounts[0];

    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacet.deploy() as DiamondCutFacet;
    await diamondCutFacet.deployed();
    log(`DiamondCutFacet deployed: ${diamondCutFacet.deployTransaction.hash} tx_hash: ${diamondCutFacet.deployTransaction.hash}`);
    dc.DiamondCutFacet = diamondCutFacet;

    // deploy Diamond
    const Diamond = await ethers.getContractFactory("contracts/IrrigationDiamond.sol:IrrigationDiamond");
    const irrigationDiamond = await Diamond.deploy(
        contractOwner.address,
        diamondCutFacet.address
    );
    await irrigationDiamond.deployed();
    dc._IrrigationDiamond = irrigationDiamond;
    networkDeployInfo.DiamondAddress = irrigationDiamond.address;

    dc.IrrigationDiamond = (await ethers.getContractFactory("hardhat-diamond-abi/HardhatDiamondABI.sol:IrrigationDiamond")).attach(irrigationDiamond.address);

    // update deployed info for DiamondCutFacet since Diamond contract constructor already adds DiamondCutFacet::diamondCut
    const funcSelectors = getSelectors(diamondCutFacet);
    networkDeployInfo.FacetDeployedInfo.DiamondCutFacet = {
        address: diamondCutFacet.address,
        tx_hash: diamondCutFacet.deployTransaction.hash,
        version: 0.0,
        funcSelectors: funcSelectors.values
    };

    log(`Diamond deployed ${irrigationDiamond.address}`);
}

export async function deployFuncSelectors (networkDeployInfo: INetworkDeployInfo, facetsToDeploy: FacetToDeployInfo = Facets) {
    const cut: FacetInfo[] = [];
    const deployedFacets = networkDeployInfo.FacetDeployedInfo;
    const deployedFuncSelectors = await getDeployedFuncSelectors(networkDeployInfo);
    const registeredFunctionSignatures = new Set<string>();

    const facetsPriority = Object.keys(facetsToDeploy).sort((a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority);
    for (const name of facetsPriority) {
        const facetDeployVersionInfo = facetsToDeploy[name];
        let facetVersions = ["0.0"];
        // sort version high to low
        if (facetDeployVersionInfo.versions) {
            facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
        }

        const upgradeVersion = +facetVersions[0];
        const facetDeployInfo = facetDeployVersionInfo.versions ? facetDeployVersionInfo.versions[upgradeVersion] : {};

        const deployedVersion = deployedFacets[name]?.version ?? (deployedFacets[name]?.tx_hash ? 0.0 : -1.0);

        const FacetContract = await ethers.getContractFactory(name);
        const facet = FacetContract.attach(deployedFacets[name].address!);

        const facetNeedsUpgrade = (!(name in deployedFuncSelectors.contractFacets) ||
        (upgradeVersion !== deployedVersion));
        dc[name] = facet;

        const origSelectors = getSelectors(facet).values;
        const newFuncSelectors = facetDeployInfo.deployInclude ?? getSelectors(facet, registeredFunctionSignatures).values;
        const removedSelectors = origSelectors.filter((v) => !newFuncSelectors.includes(v));
        if (removedSelectors.length) {
            log(`${name} removed ${removedSelectors.length} selectors: [${removedSelectors}]`);
        }

        let numFuncSelectorsCut = 0;
        // remove any function selectors from this facet that were previously deployed but no longer exist
        const deployedContractFacetsSelectors = deployedFuncSelectors.contractFacets[name];
        const deployedToRemove = deployedContractFacetsSelectors?.filter((v) => !newFuncSelectors.includes(v)) ?? [];
        // removing any previous deployed function selectors that were removed from this contract
        if (deployedToRemove.length) {
            cut.unshift({
                facetAddress: ethers.constants.AddressZero,
                action: FacetCutAction.Remove,
                functionSelectors: deployedToRemove,
                name: name
            });
            numFuncSelectorsCut++;
        }

        if (newFuncSelectors.length) {
            const initFunc = facetNeedsUpgrade
                ? ((deployedVersion === facetDeployInfo.fromVersion) ? facetDeployInfo.upgradeInit : facetDeployInfo.init)
                : null;
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
                    initFunc: initFunc
                });
                numFuncSelectorsCut++;
            }

            if (addFuncSelectors.length) {
                cut.push({
                    facetAddress: facet.address,
                    action: FacetCutAction.Add,
                    functionSelectors: addFuncSelectors,
                    name: name,
                    initFunc: initFunc
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
            log(`*** Skipping ${name} as there were no modifications to deployed facet function selectors`);
        }
    }

    // upgrade diamond with facets
    log("");
    log("Diamond Cut:", cut);
    const diamondCut = dc.IrrigationDiamond as IDiamondCut;

    for (const facetCutInfo of cut) {
        const contract = dc[facetCutInfo.name]!;
        let functionCall;
        let initAddress;
        if (facetCutInfo.initFunc) {
            functionCall = contract.interface.encodeFunctionData(facetCutInfo.initFunc!);
            initAddress = facetCutInfo.facetAddress;
            log(`Calling Function ${facetCutInfo.initFunc}`);
        } else {
            functionCall = [];
            initAddress = ethers.constants.AddressZero;
        }
        log("Cutting: ", facetCutInfo);
        try {
            const tx = await diamondCut.diamondCut([facetCutInfo], initAddress, functionCall,
                { gasLimit: GAS_LIMIT_CUT_BASE + (facetCutInfo.functionSelectors.length * GAS_LIMIT_PER_FACET) });
            log(`Diamond cut: ${facetCutInfo.name} tx hash: ${tx.hash}`);
            const receipt = await tx.wait();
            if (!receipt.status) {
                throw Error(`Diamond upgrade of ${facetCutInfo.name} failed: ${tx.hash}`);
            }
        } catch (e) {
            log(`unable to cut facet: ${facetCutInfo.name}\n ${e}`);
            continue;
        }

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

    log("Diamond Facets cuts completed");
}

export async function afterDeployCallbacks (networkDeployInfo: INetworkDeployInfo, facetsToDeploy: FacetToDeployInfo = Facets) {
    const facetsPriority = Object.keys(facetsToDeploy).sort((a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority);
    for (const name of facetsPriority) {
        const facetDeployVersionInfo = facetsToDeploy[name];
        let facetVersions = ["0.0"];
        // sort version high to low
        if (facetDeployVersionInfo.versions) {
            facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
        }

        const upgradeVersion = +facetVersions[0];
        const facetDeployInfo = facetDeployVersionInfo.versions ? facetDeployVersionInfo.versions[upgradeVersion] : {};
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

export async function deployAndInitDiamondFacets (networkDeployInfo: INetworkDeployInfo, facetsToDeploy: FacetToDeployInfo = Facets) {
    await deployDiamondFacets(networkDeployInfo, facetsToDeploy);
    await deployFuncSelectors(networkDeployInfo, facetsToDeploy);
    await afterDeployCallbacks(networkDeployInfo, facetsToDeploy);
}

export async function deployDiamondFacets (networkDeployInfo: INetworkDeployInfo, facetsToDeploy: FacetToDeployInfo = Facets) {
    // deploy facets
    log("");
    log("Deploying facets");
    const deployedFacets = networkDeployInfo.FacetDeployedInfo;

    const facetsPriority = Object.keys(facetsToDeploy).sort((a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority);
    for (const name of facetsPriority) {
        const facetDeployVersionInfo = facetsToDeploy[name];
        let facet: BaseContract;
        let facetVersions = ["0.0"];
        // sort version high to low, could be used for future upgrading from version X to version Y
        if (facetDeployVersionInfo.versions) {
            facetVersions = Object.keys(facetDeployVersionInfo.versions).sort((a, b) => +b - +a);
        }

        const upgradeVersion = +facetVersions[0];

        const deployedVersion = deployedFacets[name]?.version ?? (deployedFacets[name]?.tx_hash ? 0.0 : -1.0);
        const facetNeedsDeployment = (!(name in deployedFacets) || (deployedVersion != upgradeVersion));
        const FacetContract = await ethers.getContractFactory(name);
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
                version: deployedVersion
            };
            log(`${name} deployed: ${facet.address} tx_hash: ${facet.deployTransaction.hash}`);
        }
    }

    log("Completed Facet deployments\n");
}

async function main () {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    if (require.main === module) {
        debug.enable("Irrigation.*:log");
        await LoadFacetDeployments();
        const deployer = (await ethers.getSigners())[0].address;
        const networkName = hre.network.name;
        if (!deployments[networkName]) {
            deployments[networkName] = {
                DiamondAddress: "",
                DeployerAddress: deployer,
                FacetDeployedInfo: {}
            };
        }
        const networkDeployedInfo = deployments[networkName];
        await deployIrrigationDiamond(networkDeployedInfo);

        log(`Contract address deployed is ${networkDeployedInfo.DiamondAddress}`);

        await deployAndInitDiamondFacets(networkDeployedInfo);
        log(`Facets deployed to: ${util.inspect(networkDeployedInfo.FacetDeployedInfo), { depth: null }}`);
        writeDeployedInfo(deployments);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
