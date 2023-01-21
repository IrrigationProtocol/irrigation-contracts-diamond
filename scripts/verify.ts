import debug from "debug";


const log: debug.Debugger = debug("IrrigationVerify:log");
import hre from "hardhat";
import {INetworkDeployInfo, writeDeployedInfo} from "../scripts/common";
import { deployments } from "../scripts/deployments";
import fs from "fs";
import util from "util";
import { BaseContract } from "ethers";
import { Facets, LoadFacetDeployments } from "../scripts/facets";
import { getInterfaceID } from "./FacetSelectors";
import { GetUpdatedFacets } from "./upgrade";

const ethers = hre.ethers;

export async function VerifyContracts(networkDeployInfo: INetworkDeployInfo) {
    // Can only verify Irrigation Diamond Contract once.
    if (!networkDeployInfo.FacetDeployedInfo["DiamondCutFacet"]?.verified) {
        log(`Verifing Irrigation Diamdond at address ${networkDeployInfo.DiamondAddress}`);
        await hre.run("verify:verify", {
            address: networkDeployInfo.DiamondAddress,
            constructorArguments: [
                networkDeployInfo.DeployerAddress,
                networkDeployInfo.FacetDeployedInfo["DiamondCutFacet"].address
            ],
        });
    }

    for (const facetName in networkDeployInfo.FacetDeployedInfo) {
        const facetContractInfo = networkDeployInfo.FacetDeployedInfo[facetName];
        if (!facetContractInfo.verified) {
            const facetAddress = facetContractInfo.address;
            log(`Verifing Irrigation Facet ${facetName} at address ${facetAddress}`);
            const facetContract: BaseContract = await ethers.getContractAt(facetName, networkDeployInfo.DiamondAddress);
            await hre.run("verify:verify", {
                address: facetAddress,
            });
            facetContractInfo.verified = true;
        }
    }
}

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    if (require.main === module) {
        debug.enable("Irrigation.*:log");
        const networkName = hre.network.name;
        log.enabled = true;
        if (networkName in deployments) {
            const networkDeployInfo: INetworkDeployInfo = deployments[networkName];
            if (!["hardhat", "localhost"].includes(networkName))
            {
                await LoadFacetDeployments();
                await VerifyContracts(networkDeployInfo);
                log(`Finished Verifying Irrigation Diamond at ${networkDeployInfo.DiamondAddress}`);
            }
            writeDeployedInfo(deployments);
            log(`Finished Verifying Irrigation Contracts/Facets at ${networkDeployInfo.DiamondAddress}`);
        }
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
