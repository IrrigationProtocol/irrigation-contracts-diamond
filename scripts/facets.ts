import { FacetToDeployInfo, UpgradeInitInfo } from './common';
import { glob } from 'glob';

export const Facets: FacetToDeployInfo = {
  DiamondCutFacet: { priority: 10, versions: { 0.0: { init: 'initDiamondCut' } } },
  DiamondLoupeFacet: { priority: 20 },
  OwnershipFacet: { priority: 30 },
  SprinklerUpgradeable: { priority: 40, versions: { 0.2: {} } },
  WaterCommonUpgradeable: { priority: 50 },
  // WaterFaucetUpgradeable: { priority: 60 },
  WaterTowerUpgradeable: { priority: 70, versions: { 0.2: {} } },
  WaterUpgradeable: { priority: 80, versions: { 0.0: { init: 'Water_Initialize' } } },
  AuctionUpgradeable: { priority: 90, versions: { 0.2: {} } },
  // ZSCUpgradeable: { priority: 100, libraries: ['BurnVerifier', 'ZetherVerifier', 'libEncryption'] },
  PodsOracleUpgradeable: { priority: 110 },
  TrancheBondUpgradeable: { priority: 120 },
  ERC1155WhitelistUpgradeable: { priority: 130 },
  PriceOracleUpgradeable: { priority: 140, libraries: ['UniswapV3Twap'] },
  IrrigationControlUpgradeable: { priority: 150, versions: { 0.2: {} } },
};

export const UpgradeInits: UpgradeInitInfo = {
  0.2: {
    initContractName: 'Upgrade002',
    initFuncName: 'init002',
    initArgs: [[3, 4, 5, 8]],
  },
};

export async function LoadFacetDeployments() {
  const imports = glob.sync(`${__dirname}/facetdeployments/*.ts`);
  for (const file of imports) {
    const deployLoad = file.replace(__dirname, '.').replace('.ts', '');
    await import(deployLoad);
  }
}
