
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
  dev: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d',
        tx_hash: '0xaf2754f75a7d820666732176403ec85114d21b39cabb6084271c4e8348035349',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x4ea0Be853219be8C9cE27200Bdeee36881612FF2',
        tx_hash: '0x4c763c8b7849978314a0fb8b6cb282f0d510bea136cd731defe4653776cb53ad',
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
        address: '0x46d4674578a2daBbD0CEAB0500c6c7867999db34',
        tx_hash: '0x0021744ac49ff8dc3c18939b80aec71a55f38798aa2ee451bb7419edbce29c73',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0x9155497EAE31D432C0b13dBCc0615a37f55a2c87',
        tx_hash: '0x85cd2288a71506c9fcb3ffe468e0fc414f2c66cb6b19e51f235dce6fd2de966f',
        version: 0,
        funcSelectors: [
          '0xa217fddf', '0xf72c0d8b',
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x4e2f37d5',
          '0xd01f63f5', '0x2f2ff15d',
          '0x91d14854', '0x36568abe',
          '0xd547741f', '0x6f992a45',
          '0xd555fd78', '0xb2dc23c3',
          '0x6b1f8ac5'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0xfB12F7170FF298CDed84C793dAb9aBBEcc01E798',
        tx_hash: '0xde2fe8d0de79719e5bb983c9305652851829cf413b997efe9eaae5d2852f875f',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterFaucetUpgradeable: {
        address: '0xc1EeD9232A0A44c2463ACB83698c162966FBc78d',
        tx_hash: '0x05d82c2dc962bf4fdefb962a55b0f6cc7f7af6ff6c4868d212287a5d88702613',
        version: 0,
        funcSelectors: [
          '0x5d7d2b2a',
          '0x556a7aa4',
          '0x6040bf8d',
          '0x4dd6c8de',
          '0xc6b61e4c',
          '0xfb8afa7f'
        ]
      },
      WaterTowerUpgradeable: {
        address: '0xC220Ed128102d888af857d137a54b9B7573A41b2',
        tx_hash: '0xf3d4a70500ae0699d2258db5da520e3a8312ca060c40ac152c984e2e66b5d8cd',
        version: 0,
        funcSelectors: [
          '0x41f894ff', '0x6d573da7',
          '0x379607f5', '0x9a408321',
          '0x775def35', '0xeedb94a9',
          '0x22c14db9', '0x2f380b35',
          '0xe627f2db', '0xa71ca78a',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0xfaE849108F2A63Abe3BaB17E21Be077d07e7a9A2',
        tx_hash: '0x1b48e0a761978833acde7f5210c5be494607616f8d072b6ea40a472a81f77a8d',
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
        address: '0x12456Fa31e57F91B70629c1196337074c966492a',
        tx_hash: '0x84c64b4a1126a23d523f68036f710d9981338dfd2c1c2eb81112a358d95952a5',
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
        address: '0xce830DA8667097BB491A70da268b76a081211814',
        tx_hash: '0xe0646cce45a3c464fdbe5de209da9eec26e13ec0ab9fd4878603b2b9e852eb26',
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
        address: '0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c',
        tx_hash: '0x93eadc0e6e16b3e854714fdbc56dbdced042284a96c6e1008f01eb32bdc9cb2c',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0x77AD263Cd578045105FBFC88A477CAd808d39Cf6',
        tx_hash: '0x91a52f84cc1fc3f0b00f2bf4fe79025b3e7c30a6837fa18c4e1ff927dbc3d7e9',
        version: 0,
        funcSelectors: [
          '0x46cb860b',
          '0xf71d60a3',
          '0x877f64e1',
          '0x7c4bd4f9',
          '0x8323ca76',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b'
        ]
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x38628490c3043E5D0bbB26d5a0a62fC77342e9d5',
        tx_hash: '0x0335c55c5a7eae4ffff69f14b7319eae13e2eddfa9b105b4e7520c95fd37f7aa',
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
        address: '0x05bB67cB592C1753425192bF8f34b95ca8649f09',
        tx_hash: '0x567ceb5dffc61d62c861014eb5b3b589327dbf8c0961408cec6993a2c3816818',
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
      }
    },
    FactoryAddress: '0x14E7558B76569be517fD48441D8F83564AE5a780',
    ExternalLibraries: {
      BurnVerifier: '0x6DcBc91229d812910b54dF91b5c2b592572CD6B0',
      ZetherVerifier: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
      libEncryption: '0xE2b5bDE7e80f89975f7229d78aD9259b2723d11F',
      UniswapV3Twap: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42'
    }
  },
  local: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d',
        tx_hash: '0xaf2754f75a7d820666732176403ec85114d21b39cabb6084271c4e8348035349',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x6DcBc91229d812910b54dF91b5c2b592572CD6B0',
        tx_hash: '0xaa99a5f73c31aab573e2afee3667fd433fa227fd8bc12114f9c53f4044d5d708',
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
        address: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
        tx_hash: '0xee24dd1741274b44ab9d1c4a23685469884c8bc48b7541251dd6769ee98dfe96',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0xE2b5bDE7e80f89975f7229d78aD9259b2723d11F',
        tx_hash: '0xd9597767331903e220ea039c4f7738d147e8bf27ef0e2b663297a06c203a9102',
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
        address: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42',
        tx_hash: '0x05267ccf7d5dd15d5b643553250fc71a5d5d92bdf9a29c0dc6198d3c99ad9515',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterTowerUpgradeable: {
        address: '0x4ea0Be853219be8C9cE27200Bdeee36881612FF2',
        tx_hash: '0xf8aa96b80ecccf9f51c41ce3d0b570579d897dd2bd2dca11ceda0bb33c728913',
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
        address: '0x46d4674578a2daBbD0CEAB0500c6c7867999db34',
        tx_hash: '0xd7f84a14d7d3616b98b2902c2c1895d93b586fe946a1f2da8b6e57f9c9f4829f',
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
        address: '0x9155497EAE31D432C0b13dBCc0615a37f55a2c87',
        tx_hash: '0x8638c5914ca514e0a92437415f1b99deaa2b9fbc24ffd12de37e88a2e1754d27',
        version: 0,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x1031ca44',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x808bf40c',
          '0x76741bb9', '0x4c85ab91',
          '0xe47fd1f1'
        ]
      },
      PodsOracleUpgradeable: {
        address: '0xfB12F7170FF298CDed84C793dAb9aBBEcc01E798',
        tx_hash: '0x45f3c387c3cf0e3f0ca0605723a131007ce66e2ff1a3ce13cc80cc33c8a6eb67',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0xc1EeD9232A0A44c2463ACB83698c162966FBc78d',
        tx_hash: '0xc5f31b25da2ad832f4346b26e6646c887c30ecd46b3109f9d9cc1a6e2993c93a',
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
        address: '0xC220Ed128102d888af857d137a54b9B7573A41b2',
        tx_hash: '0x51ebc80b45796066e74997106c79f71c2cbec177e25aaf5f8179a1165b193f72',
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
        address: '0xfaE849108F2A63Abe3BaB17E21Be077d07e7a9A2',
        tx_hash: '0x3857801d06b97cc788fbfd173b19233ab637e377de0ab69961e88eecc64cd41b',
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
        address: '0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038',
        tx_hash: '0xa59386f6b4abdf68d231b8c56a426ec13d7868ba602c4d4d062c7a09f3e15831',
        version: 1.1,
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
    ExternalLibraries: { UniswapV3Twap: '0x447786d977Ea11Ad0600E193b2d07A06EfB53e5F' }
  }
};
