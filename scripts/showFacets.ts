import debug from "debug";


const log: debug.Debugger = debug("IrrigationShowFacets:log");
import hre from "hardhat";
import {INetworkDeployInfo, writeDeployedInfo} from "../scripts/common";
import { deployments } from "../scripts/deployments";
import fs from "fs";
import util from "util";
import { BaseContract } from "ethers";
import { Facets, LoadFacetDeployments } from "../scripts/facets";
import { getDeployedFuncSelectors, getInterfaceID } from "./FacetSelectors";
import { GetUpdatedFacets } from "./upgrade";

const ethers = hre.ethers;


async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    if (require.main === module) {
        debug.enable("Irrigation.*:log");
        await LoadFacetDeployments();
        const networkName = hre.network.name;
        log.enabled = true;
        if (networkName in deployments) {
            const networkDeployInfo: INetworkDeployInfo = deployments[networkName];
            const deployedFacetSelectorInfo = await getDeployedFuncSelectors(networkDeployInfo);
            log(`${networkName} ${util.inspect(deployedFacetSelectorInfo, { depth: null })}`);
            writeDeployedInfo(deployments);
        }
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
