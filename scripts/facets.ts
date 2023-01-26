import { FacetToDeployInfo } from "./common";
import { glob } from "glob";

export const Facets: FacetToDeployInfo = {
  DiamondCutFacet: { priority: 10 },
  DiamondLoupeFacet: { priority: 20 },
  OwnershipFacet: { priority: 30 },
  SprinklerUpgradeable: { priority: 40  },
  MockWaterCommonUpgradeable: { priority: 50 }, // use mock until WaterCommonUpgradeable is completed.
  WaterFaucetUpgradeable: { priority: 60  },
  WaterTowerUpgradeable: { priority: 70  },
  WaterUpgradeable: { priority: 80, versions: { 0.0: { init: "Water_Initialize" } } },
};

export async function LoadFacetDeployments () {
  const imports = glob.sync(`${__dirname}/facetdeployments/*.ts`);
  for (const file of imports) {
    const deployLoad = file.replace(__dirname, ".").replace(".ts", "");
    await import(deployLoad);
  }
};
