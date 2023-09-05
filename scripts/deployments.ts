
import { INetworkDeployInfo } from "../scripts/common";
export const deployments: { [key: string]: INetworkDeployInfo } = {
  goerli: {
    DiamondAddress: '0xa7e199eFf51B535171AA41Ff5adb96F668b637BB',
    DeployerAddress: '0x80354071C2D5199e4b2d690DB85f13ba47b54e11',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x98af1E014BdE8882Da13BF16DB42D59b317ce1fD',
        tx_hash: '0x0b6b565c17e593f760ab923404e3b2341e40b75c8a499ea2327e9de673174a56',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x3aD628985440d955Bf5CbB7FB547E961A1f9163B',
        tx_hash: '0x9424f4556f8a568e89872ffa464336ada830595e900614b4e1a578e8e02d1183',
        version: 0,
        funcSelectors: [
          '0xcdffacc6',
          '0x52ef6b2c',
          '0xadfca15e',
          '0x7a0ed627',
          '0x01ffc9a7'
        ]
      },
      OwnershipFacet: {
        address: '0xF87d6c1Ec641e9a7b5e3Cfd701e2981Ed0963beD',
        tx_hash: '0x46413cea7f9aec05abbc3509a22f567d5aec6fb8f94b384a755faa35b557f09e',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0x2bbBDa5Dda7a5F6e843e5cd64b61fb5bACDb5af2',
        tx_hash: '0xcbb64c37f859061bd77da79eb06b0e030a1ffa25d76a15d6434b0b99aaede390',
        version: 0,
        funcSelectors: [
          '0xa217fddf', '0xf72c0d8b',
          '0x5efa5f82', '0x51763ea0',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x4e2f37d5',
          '0xd01f63f5', '0x2f2ff15d',
          '0x91d14854', '0x2951f1b2',
          '0x36568abe', '0xd547741f',
          '0x67a74ddc', '0x6f992a45',
          '0x51bbfab8', '0xb2dc23c3',
          '0x6b1f8ac5'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0x7A3a771941f0de4013E294d2eE482c8f1549f309',
        tx_hash: '0x2f5de5246da6b381afbd3c781fce579cdc269ccdf825dcb67ea67d2ccc37dcf3',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterFaucetUpgradeable: {
        address: '0x716BA2AF5CEA42435Ff1a8491bef78eb8Ef61afc',
        tx_hash: '0xe17a01937dfa2f696d5c40d6857cb4414a145fe0a6260d3b8ff4cd369b18a467',
        version: 0,
        funcSelectors: [
          '0x5d7d2b2a',
          '0x556a7aa4',
          '0xc3490263',
          '0x4dd6c8de',
          '0xc6b61e4c',
          '0xfb8afa7f'
        ]
      },
      WaterTowerUpgradeable: {
        address: '0xd49574fcFc823A30085CAAd70Abbd4F0398c865e',
        tx_hash: '0x575975a33a047541348c261c718a9d6ca5b5b0244bef98abcf0eed119e8a905d',
        version: 0,
        funcSelectors: [
          '0x379607f5',
          '0xaa5f7e26',
          '0xb6b55f25',
          '0xfae6c61e',
          '0x7d882097',
          '0x1959a002',
          '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0x5d9CB5B339DFCCF8222315bA19867f18986D54B5',
        tx_hash: '0x3ffbab8aa71d7f72f19d27bfdcdb1375ae810bb8d44248d2a53bca39b1130f98',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ]
      },
      AuctionUpgradeable: {
        address: '0x663a3A3D4f81653de25C8Baab6c0072f62c327b7',
        tx_hash: '0x81c9c6776be13a6b1b1f4c11a335f2e1138c2c1e4f04cd32110bc144b3458eb4',
        version: 0,
        funcSelectors: [
          '0xd73792a9', '0x7d9fc5f0',
          '0xd742245d', '0x2e0e7129',
          '0x236ed8f3', '0xa0e83f22',
          '0x78bd7935', '0x1031ca44',
          '0xe45c1879', '0x582c7ffd',
          '0xe247787b', '0x8e8fbb44',
          '0x72420157', '0x54fdbe1a',
          '0x60a3aabf', '0x8607a474'
        ]
      },
      ZSCUpgradeable: {
        address: '0x794040d555A5120827bCa40DAF229136094697A6',
        tx_hash: '0x8a488ab6d9e2ec5fea5b48bfd1a2c15796540725b554fad98affb05084397825',
        version: 0,
        funcSelectors: [
          '0x5796968e', '0x33733214',
          '0x77cd6ecd', '0xcfe8a73b',
          '0xced72f87', '0x21df0da7',
          '0x399ae724', '0x3362da44',
          '0x9b0d85d3', '0xad960d90',
          '0x0a566f2f', '0x79e543d0',
          '0x601fa93d', '0xa257a18d',
          '0x621f59a4'
        ]
      },
      PodsOracleUpgradeable: {
        address: '0xb71F18F0D1A816a8D045b4Afc2De3A25e4CAf75d',
        tx_hash: '0x88a9057c3a3e4d49d4fbcaaf8850e2d0645840b75d1b9c334755eae2e7b03890',
        version: 0,
        funcSelectors: [ '0xa3e6ba94', '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0x55f73AB4d6441B8cdB9D44a89e5FBbdAdFf48055',
        tx_hash: '0xb0e85a6f7b226e9c4c10ff16c3ddb45cd54a15a6f371d2ef030e7cc315ecbd6e',
        version: 0,
        funcSelectors: [
          '0x46cb860b',
          '0x877f64e1',
          '0x7c4bd4f9',
          '0x46613c67',
          '0xefe802d7',
          '0x1b20eaef'
        ]
      }
    },
    ExternalLibraries: {
      BurnVerifier: '0x8Af8CEf5EFb57BF8E1632acEFb012672cad0fCc2',
      ZetherVerifier: '0xAda2cfA6Ad6BA1F7be7F1C31cF12e72C95F66b4c',
      libEncryption: '0x88107F0EdC3C1Efe52308852d9E6940924bC5783'
    }
  },
  local: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0xf201fFeA8447AB3d43c98Da3349e0749813C9009',
        tx_hash: '0xf629ca66b9119d6b1bce3245e6b4eaf892a74c6f21a61547f8d2c21923d5cd4d',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad',
        tx_hash: '0x543dc48e9679bcfc12197b9cc8f5057a61a8b0da97f2c829dc69b55734e7473d',
        version: 0,
        funcSelectors: [
          '0xcdffacc6',
          '0x52ef6b2c',
          '0xadfca15e',
          '0x7a0ed627',
          '0x01ffc9a7'
        ]
      },
      OwnershipFacet: {
        address: '0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af',
        tx_hash: '0x9b32a50e02597dc91a77e3b5fd91ebf1bc51735478fb0d12e84476de4a3a5339',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0xde79380FBd39e08150adAA5C6c9dE3146f53029e',
        tx_hash: '0x27f62889bb08f04da7766ab4b81f52e0a473efd6eb78d93a8c30fbbd9ba9daf2',
        version: 0,
        funcSelectors: [
          '0xa217fddf', '0xf72c0d8b',
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x248a9ca3',
          '0x9010d07c', '0xca15c873',
          '0x4e2f37d5', '0xd01f63f5',
          '0x2f2ff15d', '0x91d14854',
          '0x36568abe', '0xd547741f',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0xbFD3c8A956AFB7a9754C951D03C9aDdA7EC5d638',
        tx_hash: '0xae2a7ce6d967d23948909bcf8c7db906745130d4c949c233a7f77c9b30901966',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterTowerUpgradeable: {
        address: '0x38F6F2caE52217101D7CA2a5eC040014b4164E6C',
        tx_hash: '0xa1fbe2d5888dd2c0f84f349b0159ce4b5d725516629d92cdc66a2105cee4e822',
        version: 0,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0xeedb94a9', '0x22c14db9',
          '0x2f380b35', '0xe627f2db',
          '0x3904503f', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0xc075BC0f734EFE6ceD866324fc2A9DBe1065CBB1',
        tx_hash: '0x7a8f8983a17fd57c664eeaf610cdf8d4f13ebd64b7b6db51de53ebe9bcbceb5a',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ]
      },
      AuctionUpgradeable: {
        address: '0xa8d297D643a11cE83b432e87eEBce6bee0fd2bAb',
        tx_hash: '0x1921717cdb95dbc62e70ff202b561c17445a4a4c4a0e2e582df0e0fceeccd319',
        version: 0,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x1031ca44',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x808bf40c',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ]
      },
      PodsOracleUpgradeable: {
        address: '0x04d7478fDF318C3C22cECE62Da9D78ff94807D77',
        tx_hash: '0x2fc568422191d019e2a8644680849cf9e23c47a8650f15384147f28368232505',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0xd9abC93F81394Bd161a1b24B03518e0a570bDEAd',
        tx_hash: '0xd1f2f91ccacc5fb5c65df463829547758642a1210429bae982279a743c7bfa86',
        version: 0,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ]
      },
      ERC1155WhitelistUpgradeable: {
        address: '0xcB0f2a13098f8e841e6Adfa5B17Ec00508b27665',
        tx_hash: '0x5fa1896a9849a604e1a07bd2d8e588aaf998d4e85c393bfbda2a1fb8de17b78c',
        version: 0,
        funcSelectors: [
          '0xd679ecf5', '0x96dd3397',
          '0x00fdd58e', '0x4e1273f4',
          '0xf5298aca', '0x6b20c454',
          '0x9762b150', '0xe8a3d485',
          '0x4f558e79', '0x3aebb682',
          '0xe985e9c5', '0x3c1c30c5',
          '0x731133e9', '0x1f7fdffa',
          '0xbc197c81', '0xf23a6e61',
          '0x15213188', '0x2eb2c2d6',
          '0xf242432a', '0xa22cb465',
          '0x938e3d7b', '0x8ef79e91',
          '0xbd85b039', '0xa3d71180',
          '0x0e89341c'
        ]
      },
      PriceOracleUpgradeable: {
        address: '0x37D31345F164Ab170B19bc35225Abc98Ce30b46A',
        tx_hash: '0x3cb6b120176859e67b5d8a6c093ac32189edb276f7cff12c574147aaae9fc1c3',
        version: 0,
        funcSelectors: [
          '0xea0129ca',
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0'
        ]
      },
      IrrigationControlUpgradeable: {
        address: '0x6345e50859b0Ce82D8A495ba9894C6C81de385F3',
        tx_hash: '0xe69e6c6c010ae616735d971b751892094fc14b293c173b43a7e55143fb8f6138',
        version: 0,
        funcSelectors: [
          '0xcb3597d8',
          '0x54fdbe1a',
          '0x49981ef5',
          '0x3a46153e',
          '0x733754e5'
        ]
      }
    },
    FactoryAddress: '0x14E7558B76569be517fD48441D8F83564AE5a780',
    ExternalLibraries: { UniswapV3Twap: '0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038' }
  },
  dev: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0xf201fFeA8447AB3d43c98Da3349e0749813C9009',
        tx_hash: '0xf629ca66b9119d6b1bce3245e6b4eaf892a74c6f21a61547f8d2c21923d5cd4d',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad',
        tx_hash: '0x543dc48e9679bcfc12197b9cc8f5057a61a8b0da97f2c829dc69b55734e7473d',
        version: 0,
        funcSelectors: [
          '0xcdffacc6',
          '0x52ef6b2c',
          '0xadfca15e',
          '0x7a0ed627',
          '0x01ffc9a7'
        ]
      },
      OwnershipFacet: {
        address: '0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af',
        tx_hash: '0x9b32a50e02597dc91a77e3b5fd91ebf1bc51735478fb0d12e84476de4a3a5339',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0xde79380FBd39e08150adAA5C6c9dE3146f53029e',
        tx_hash: '0x27f62889bb08f04da7766ab4b81f52e0a473efd6eb78d93a8c30fbbd9ba9daf2',
        version: 0,
        funcSelectors: [
          '0xa217fddf', '0xf72c0d8b',
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x248a9ca3',
          '0x9010d07c', '0xca15c873',
          '0x4e2f37d5', '0xd01f63f5',
          '0x2f2ff15d', '0x91d14854',
          '0x36568abe', '0xd547741f',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0xbFD3c8A956AFB7a9754C951D03C9aDdA7EC5d638',
        tx_hash: '0xae2a7ce6d967d23948909bcf8c7db906745130d4c949c233a7f77c9b30901966',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterTowerUpgradeable: {
        address: '0x38F6F2caE52217101D7CA2a5eC040014b4164E6C',
        tx_hash: '0xa1fbe2d5888dd2c0f84f349b0159ce4b5d725516629d92cdc66a2105cee4e822',
        version: 0,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0xeedb94a9', '0x22c14db9',
          '0x2f380b35', '0xe627f2db',
          '0x3904503f', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0xc075BC0f734EFE6ceD866324fc2A9DBe1065CBB1',
        tx_hash: '0x7a8f8983a17fd57c664eeaf610cdf8d4f13ebd64b7b6db51de53ebe9bcbceb5a',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ]
      },
      AuctionUpgradeable: {
        address: '0x837a41023CF81234f89F956C94D676918b4791c1',
        tx_hash: '0x81e9539a0f25c1a777fc0939463d43568194a7dd7c4f91f4150253285fef4e7b',
        version: 0,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x1031ca44',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x808bf40c',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ]
      },
      PodsOracleUpgradeable: {
        address: '0x04d7478fDF318C3C22cECE62Da9D78ff94807D77',
        tx_hash: '0x2fc568422191d019e2a8644680849cf9e23c47a8650f15384147f28368232505',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0xd9abC93F81394Bd161a1b24B03518e0a570bDEAd',
        tx_hash: '0xd1f2f91ccacc5fb5c65df463829547758642a1210429bae982279a743c7bfa86',
        version: 0,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ]
      },
      ERC1155WhitelistUpgradeable: {
        address: '0xcB0f2a13098f8e841e6Adfa5B17Ec00508b27665',
        tx_hash: '0x5fa1896a9849a604e1a07bd2d8e588aaf998d4e85c393bfbda2a1fb8de17b78c',
        version: 0,
        funcSelectors: [
          '0xd679ecf5', '0x96dd3397',
          '0x00fdd58e', '0x4e1273f4',
          '0xf5298aca', '0x6b20c454',
          '0x9762b150', '0xe8a3d485',
          '0x4f558e79', '0x3aebb682',
          '0xe985e9c5', '0x3c1c30c5',
          '0x731133e9', '0x1f7fdffa',
          '0xbc197c81', '0xf23a6e61',
          '0x15213188', '0x2eb2c2d6',
          '0xf242432a', '0xa22cb465',
          '0x938e3d7b', '0x8ef79e91',
          '0xbd85b039', '0xa3d71180',
          '0x0e89341c'
        ]
      },
      PriceOracleUpgradeable: {
        address: '0x37D31345F164Ab170B19bc35225Abc98Ce30b46A',
        tx_hash: '0x3cb6b120176859e67b5d8a6c093ac32189edb276f7cff12c574147aaae9fc1c3',
        version: 0,
        funcSelectors: [
          '0xea0129ca',
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0'
        ]
      },
      IrrigationControlUpgradeable: {
        address: '0x6345e50859b0Ce82D8A495ba9894C6C81de385F3',
        tx_hash: '0xe69e6c6c010ae616735d971b751892094fc14b293c173b43a7e55143fb8f6138',
        version: 0,
        funcSelectors: [
          '0xcb3597d8',
          '0x54fdbe1a',
          '0x49981ef5',
          '0x3a46153e',
          '0x733754e5'
        ]
      }
    },
    FactoryAddress: '0x14E7558B76569be517fD48441D8F83564AE5a780',
    ExternalLibraries: { UniswapV3Twap: '0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038' }
  }
};
