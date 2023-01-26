import { FacetToDeployInfo } from "./common";
import { glob } from "glob";

export const Facets: FacetToDeployInfo = {
  DiamondCutFacet: { priority: 10 },
  DiamondLoupeFacet: { priority: 20 },
  OwnershipFacet: { priority: 30 },
  SprinklerUpgradeable: { priority: 40  },
  WaterFaucetUpgradeable: { priority: 50  },
  WaterTowerUpgradeable: { priority: 60  },
  WaterUpgradeable: { priority: 70, versions: { 0.0: { init: "Water_Initialize" } } },
};

export async function LoadFacetDeployments () {
  const imports = glob.sync(`${__dirname}/facetdeployments/*.ts`);
  for (const file of imports) {
    const deployLoad = file.replace(__dirname, ".").replace(".ts", "");
    await import(deployLoad);
  }
};
