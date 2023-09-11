import fetch from 'node-fetch';
import fs from 'fs';
import { CONTRACT_ADDRESSES } from '../../scripts/shared';

export const getGraphqlData = async (query, url) => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
      }),
    });
    const result = await res.json();
    return { result: result?.data };
  } catch (err) {
    console.log('--fetch graphql error-', err);
    return { result: false, error: true };
  }
};

export const getHoldPlotsFromGraphql = async (addresses: string[], url: string) => {
  const query = `
    {
        plots(where: {farmer_in: [ ${addresses.map((e) => `"${e.toLowerCase()}"`).join()}] }) {
                index   
                pods
                farmer {
                    id
                }
        }
    }`;
  return await getGraphqlData(query, url);
};
async function impersonateSigner(signerAddress, hre) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [signerAddress],
  });
  return await hre.ethers.getSigner(signerAddress);
}

const restorePlot = async (index: string, pods: string, farmer: string, hre) => {
  const tempSigner = (await hre.ethers.getSigners())[0];
  const signer = await impersonateSigner(farmer, hre);
  const beanstalk = await hre.ethers.getContractAt(
    'IBeanstalkUpgradeable',
    CONTRACT_ADDRESSES.BEANSTALK,
  );
  const realPods = await beanstalk.plot(signer.address, index);
  if (realPods.toString() === pods) {
    await beanstalk
      .connect(signer)
      .transferPlot(signer.address, tempSigner.address, index, 0, pods);
    await beanstalk
      .connect(tempSigner)
      .transferPlot(tempSigner.address, signer.address, index, 0, pods);
    console.log('done restoring', farmer, index);
  }
};

export const restorePlots = async (hre) => {
  // get beta tester addresses
  let addresses = [];
  try {
    addresses = (await fs.promises.readFile(__dirname + '/beta.tester.txt', 'utf8')).split('\n');
  } catch (e) {
    console.log('--restoring plots error', e);
    return;
  }
  console.log('Total beta tester addresses: ', addresses.length);
  if (!process.env.BEANSTALK_GRAPHQL_URL) {
    console.log('No BEANSTALK_GRAPHQL_URL in .env');
    return;
  }
  // get plots that testers hold
  const result = await getHoldPlotsFromGraphql(addresses, process.env.BEANSTALK_GRAPHQL_URL);
  if (result?.result?.plots) {
    for (const plot of result.result.plots) {
      await restorePlot(plot.index, plot.pods, plot.farmer.id, hre);
    }
  }
};
