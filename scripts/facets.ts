import { FacetToDeployInfo } from "./common";
import { glob } from "glob";

export const Facets: FacetToDeployInfo = {
  DiamondCutFacet: { priority: 10 },
  DiamondLoupeFacet: { priority: 20 },
  OwnershipFacet: { priority: 30 },
  SprinklerFacet: { priority: 40, versions: { 0.0: { init: "Sprinkler_Initialize" } } },
  WaterFaucetFacet: { priority: 50, versions: { 0.0: { init: "Water_Initialize" } } },
  WaterTower: { priority: 60, versions: { 0.0: { init: "EscrowAIJob_Initialize" } } },
  Water: { priority: 70, versions: { 0.0: { init: "_Initialize" } } },
};

export async function LoadFacetDeployments () {
  const imports = glob.sync(`${__dirname}/facetdeployments/*.ts`);
  for (const file of imports) {
    const deployLoad = file.replace(__dirname, ".").replace(".ts", "");
    await import(deployLoad);
  }
};
