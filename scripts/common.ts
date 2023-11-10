import { BaseContract, BigNumber, utils } from 'ethers';
import { Fragment } from '@ethersproject/abi';
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';
import { includesInAbi } from './shared';

export const toBN = BigNumber.from;
export const FERTILIZER_TOKEN_ID = 0;

export interface IFacetDeployedInfo {
  address?: string;
  tx_hash?: string;
  funcSelectors?: string[];
  verified?: boolean;
  version?: number;
}

export type FacetDeployedInfo = Record<string, IFacetDeployedInfo>;

// map Facet Selectors to contract address string
export interface IDeployedFacetSelectors {
  facets: Record<string, string>;
}

// map contract name to array of FacetSignature strings
export interface IDeployedContractFacetSelectors {
  contractFacets: Record<string, string[]>;
}

export type FacetSelectorsDeployed = IDeployedFacetSelectors & IDeployedContractFacetSelectors;

export interface INetworkDeployInfo {
  DiamondAddress: string;
  DeployerAddress: string;
  FacetDeployedInfo: FacetDeployedInfo;
  ExternalLibraries?: any;
  FactoryAddress?: string;
}

export type AfterDeployInit = (networkDeployInfo: INetworkDeployInfo) => Promise<void | boolean>;

export interface IVersionInfo {
  fromVersion?: number;
  init?: string;
  upgradeInit?: string;
  deployInclude?: string[];
  callback?: AfterDeployInit;
}

export type VersionRecord = Record<number, IVersionInfo>;

export interface IFacetToDeployInfo {
  priority: number;
  versions?: VersionRecord;
  libraries?: string[];
}

export interface IUpgradeInit {
  initContractName: string;
  initFuncName: string;
  initArgs: any;
}

export type FacetToDeployInfo = Record<string, IFacetToDeployInfo>;
export type UpgradeInitInfo = Record<string, IUpgradeInit>;

export function toWei(value: number | string): BigNumber {
  return utils.parseEther(value.toString());
}

export function toD6(value: number | string): BigNumber {
  if (typeof value === 'number') value = Math.floor(value * 10 ** 6) / 10 ** 6;
  return utils.parseUnits(value.toString(), 6);
}

export function toD4(value: number | string): BigNumber {
  if (typeof value === 'number') value = Math.floor(value * 10 ** 4) / 10 ** 4;
  return utils.parseUnits(value.toString(), 4);
}

export function fromWei(value: number | string | BigNumber): number {
  return Number(utils.formatEther(value));
}

export function fromD6(value: number | string | BigNumber): number {
  return Number(utils.formatUnits(value, 6));
}

export function fromGWei(value: number | string | BigNumber): number {
  return Number(utils.formatUnits(value, 9));
}

export function formatFixed(value: number): number {
  return Number(value.toFixed(6));
}

export function mulDivRoundingUp(a: BigNumber, b: BigNumber, d: BigNumber): BigNumber {
  let x: BigNumber = a.mul(b).div(d);
  if (a.mul(b).mod(d).gt(0)) x = x.add(1);
  return x;
}

export function getSighash(funcSig: string): string {
  return utils.Interface.getSighash(Fragment.fromString(funcSig));
}

export function writeDeployedInfo(deployments: { [key: string]: INetworkDeployInfo }) {
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

export type DeployedContracts = Record<string, BaseContract>;

export const dc: DeployedContracts = {};

export function random32bit() {
  let u = new Uint32Array(1);
  const randomeBuffer = crypto.randomBytes(32);
  return '0x' + randomeBuffer.toString('hex');
}

export function writeIrrigationAbi(rawAbi: any[]) {
  const filteredAbi = rawAbi.filter((abiElement, index, abi) => {
    if (includesInAbi.includes(abiElement.name)) {
      return true;
    }
    return false;
  });
  fs.writeFileSync('data/abi/Irrigation.json', JSON.stringify(filteredAbi, null, 2), 'utf8');
}
