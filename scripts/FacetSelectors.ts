import { ethers } from "hardhat";
import { Contract, ContractInterface, utils, BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import { FacetSelectorsDeployed, INetworkDeployInfo, debuglog } from "./common";
import { DiamondLoupeFacet } from "../typechain-types/DiamondLoupeFacet";

export enum FacetCutAction {
  Add = 0,
  Replace = 1,
  Remove = 2,
}

export interface FacetInfo {
  facetAddress: string;
  action: FacetCutAction;
  functionSelectors: string[];
  name: string;
  initFunc?: string | null;
}

export class Selectors {
  contract: Contract;
  values: string[] = [];

  constructor(contract: Contract) {
    this.contract = contract;
  }

  // used with getSelectors to remove selectors from an array of selectors
  // functionNames argument is an array of function signatures
  remove(functionNames: string[]): Selectors {
    const newSelectors: Selectors = new Selectors(this.contract);
    newSelectors.values = this.values.filter((v) => {
      for (const functionName of functionNames) {
        if (v === this.contract.interface.getSighash(functionName)) {
          return false;
        }
      }
      return true;
    });
    return newSelectors;
  }

  // used with getSelectors to get selectors from an array of selectors
  // functionNames argument is an array of function signatures
  get(functionNames: string[]): Selectors {
    const newSelectors = new Selectors(this.contract);
    newSelectors.values = this.values.filter((v) => {
      for (const functionName of functionNames) {
        if (v === this.contract.interface.getSighash(functionName)) {
          return true;
        }
      }
      return false;
    });
    return newSelectors;
  }

  // remove selectors using an array of function names
  removeSelectors(signatures: string[]) {
    const iface = new ethers.utils.Interface(
      signatures.map((v) => "function " + v)
    );
    const removeSelectors = signatures.map((v) => iface.getSighash(v));
    this.values = this.values.filter((v) => !removeSelectors.includes(v));
    return this;
  }
}

// get function selectors from ABI
export function getSelectors(
  contract: Contract,
  exclude: Set<string> | null = null
): Selectors {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = new Selectors(contract);
  selectors.values = signatures.reduce<string[]>((acc, val) => {
    const funcSignature = contract.interface.getSighash(val);
    if (!exclude || !exclude.has(funcSignature)) {
      acc.push(funcSignature);
    }
    return acc;
  }, []);
  return selectors;
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets(
  facetAddress: string,
  facets: FacetInfo[]
) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i;
    }
  }
}

export function getInterfaceID(contractInterface: utils.Interface) {
  let interfaceID: BigNumber = ethers.constants.Zero;
  const functions: string[] = Object.keys(contractInterface.functions);
  for (let i=0; i< functions.length; i++) {
      interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID;
}

export async function getDeployedFuncSelectors(networkDeployInfo: INetworkDeployInfo): Promise<FacetSelectorsDeployed> {

  // map funcSelectors to contract address
  const deployedFuncSelectors: Record<string, string> = {};
  // map contract name to container of funcSelectors
  const deployedContractFuncSelectors: Record<string, string[]> = {};
  let diamondLoupe: DiamondLoupeFacet | undefined;
  if (networkDeployInfo.FacetDeployedInfo["DiamondLoupeFacet"]?.address &&
      networkDeployInfo.FacetDeployedInfo["DiamondLoupeFacet"].funcSelectors &&
          networkDeployInfo.FacetDeployedInfo["DiamondLoupeFacet"].funcSelectors.length > 0) {
    const factory = await ethers.getContractFactory("DiamondLoupeFacet")
    diamondLoupe = factory.attach(networkDeployInfo.DiamondAddress) as DiamondLoupeFacet;
    const deployedFacets = await diamondLoupe.facets({ gasLimit: 2000000});
    for (const facetDeployedInfo of deployedFacets) {
      for (const facetIndex of facetDeployedInfo.functionSelectors) {
        deployedFuncSelectors[facetIndex] = facetDeployedInfo.facetAddress;
      }
    }
  }

  for (const contractName in networkDeployInfo.FacetDeployedInfo) {
    const facetInfo = networkDeployInfo.FacetDeployedInfo[contractName];
    // make sure these were really deployed using louper
    if (diamondLoupe && facetInfo.address) {
      facetInfo.funcSelectors = await diamondLoupe.facetFunctionSelectors(facetInfo.address,{ gasLimit: 2000000});
      deployedContractFuncSelectors[contractName] = facetInfo.funcSelectors;
    } else if (facetInfo.funcSelectors) {
      deployedContractFuncSelectors[contractName] = facetInfo.funcSelectors;
      for (const funcSelector of facetInfo.funcSelectors!) {
        deployedFuncSelectors[funcSelector] = facetInfo.address!;
      }
    }
  }

  return Promise.resolve({ facets: deployedFuncSelectors, contractFacets: deployedContractFuncSelectors} );
}
