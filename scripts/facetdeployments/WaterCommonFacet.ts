import { IrrigationDiamond } from '../../typechain-types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { dc, assert, debuglog, INetworkDeployInfo, AfterDeployInit } from '../common';
import { Facets } from '../facets';
import hre from 'hardhat';

const BeanStalkProxyAddresses: { [key: string]: string } = {
  goerli: '',
  mainnet: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
  hardhat: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5', // for testing
  anvil: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
  dev: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
  local: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
};

const FertilizerTokenAddresses: { [key: string]: string } = {
  goerli: '',
  mainnet: '0x402c84de2ce49af88f5e2ef3710ff89bfed36cb6',
  hardhat: '0x402c84de2ce49af88f5e2ef3710ff89bfed36cb6', // for testing
  anvil: '0x402c84de2ce49af88f5e2ef3710ff89bfed36cb6',
  dev: '0x402c84de2ce49af88f5e2ef3710ff89bfed36cb6',
  local: '0x402c84de2ce49af88f5e2ef3710ff89bfed36cb6',
};

export const afterDeploy: AfterDeployInit = async (networkDeployInfo: INetworkDeployInfo) => {
  debuglog('In WaterCommon after Deploy function');

  const irrigationDiamond = dc.IrrigationDiamond as IrrigationDiamond;
  const networkName = hre.network.name;
  // we will deploy moc tokens on goerli and init protocol with them.
  if (networkName === 'goerli') return;
  // allow Beanstalk Proxy Operator
  assert(
    networkName in BeanStalkProxyAddresses,
    'Need valid beanstalk address to interface with the contract',
  );
  const beanStalkProxyAddress: string = BeanStalkProxyAddresses[networkName];
  assert(
    networkName in FertilizerTokenAddresses,
    'Need valid fertilizer address to interface with the contract',
  );
  const fertilizerAddress: string = FertilizerTokenAddresses[networkName];
  try {
    await irrigationDiamond.WaterCommon_Initialize(beanStalkProxyAddress, fertilizerAddress);
  } catch (e) {
    debuglog(`Warning, couldn't save proxy & fertilizer address for ${networkName}
        beanstalk contract at ${beanStalkProxyAddress}
        or fertilizer contact at ${fertilizerAddress}
        ${e}`);
  }
};
