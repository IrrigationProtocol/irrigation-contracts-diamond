import { FacetToDeployInfo, toD6, toWei } from './common';
import { glob } from 'glob';
import { afterDeploy } from './facetdeployments/WaterCommonFacet';

export const Facets: FacetToDeployInfo = {
  DiamondCutFacet: { priority: 10, versions: { 0.0: { init: 'initDiamondCut' } } },
  DiamondLoupeFacet: { priority: 20 },
  OwnershipFacet: { priority: 30 },
  SprinklerUpgradeable: { priority: 40, versions: { 0.1: { init: null } } },
  WaterCommonUpgradeable: { priority: 50, versions: { 0.0: {} } },
  // WaterFaucetUpgradeable: { priority: 60 },
  WaterTowerUpgradeable: { priority: 70, versions: { 0.3: { init: null } } },
  WaterUpgradeable: { priority: 80, versions: { 0.0: { init: 'Water_Initialize' } } },
  AuctionUpgradeable: { priority: 90, versions: { 0.2: { init: null } } },
  // ZSCUpgradeable: { priority: 100, libraries: ['BurnVerifier', 'ZetherVerifier', 'libEncryption'] },
  PodsOracleUpgradeable: { priority: 110 },
  TrancheBondUpgradeable: { priority: 120 },
  ERC1155WhitelistUpgradeable: { priority: 130 },
  PriceOracleUpgradeable: { priority: 140, libraries: ['UniswapV3Twap'] },
  IrrigationControlUpgradeable: {
    priority: 150,
    versions: {
      0.2: {
        init: 'initAuctionFee',
        initArgs: [
          {
            limits: [toWei(32), toWei(320), toWei(3200), toWei(32000), toWei(320000)],
            listingFees: [toD6(0.025), toD6(0.01), toD6(0.0066), toD6(0.0033), toD6(0.002), 0],
            successFees: [
              toD6(0.05),
              toD6(0.015),
              toD6(0.01),
              toD6(0.0075),
              toD6(0.005),
              toD6(0.005),
            ],
          },
        ],
      },
    },
  },
  Upgrade002: { priority: 160, versions: { 0.2: { init: 'init001' } } },
};

export async function LoadFacetDeployments() {
  const imports = glob.sync(`${__dirname}/facetdeployments/*.ts`);
  for (const file of imports) {
    const deployLoad = file.replace(__dirname, '.').replace('.ts', '');
    await import(deployLoad);
  }
}
