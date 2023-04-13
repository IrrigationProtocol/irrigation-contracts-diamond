
import { INetworkDeployInfo } from "../scripts/common";
export const deployments: { [key: string]: INetworkDeployInfo } = {
  dev: {
    DiamondAddress: '0xAAbeBFF488546e50561D21ab09D257aBADc69fd0',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x6D712CB50297b97b79dE784d10F487C00d7f8c2C',
        tx_hash: '0xfc781a76c7e3ea251db309547b81ed892a1d316aef9f1df2a6a52067b54e79e6',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0x21915b79E1d334499272521a3508061354D13FF0',
        tx_hash: '0x997ddc9e69a1362ffa636e2fa4d1ea120b46b836ff572eb5150cdbebaa97b513',
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
        address: '0x44863F234b137A395e5c98359d16057A9A1fAc55',
        tx_hash: '0xfd9c91e9c06b8f5f200706ca250dfa9f872f0ed1059d7f0717bf4177f50f66ec',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0x0c03eCB91Cb50835e560a7D52190EB1a5ffba797',
        tx_hash: '0x236015c1992998f349c7568a591633d2762b8792e74557335ee1b21e50aae5d6',
        version: 0,
        funcSelectors: [
          '0xa217fddf', '0xf72c0d8b',
          '0x5efa5f82', '0x51763ea0',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0x2951f1b2',
          '0x36568abe', '0xd547741f',
          '0x67a74ddc', '0x6f992a45',
          '0x51bbfab8', '0xb2dc23c3',
          '0x6b1f8ac5'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0x1c39BA375faB6a9f6E0c01B9F49d488e101C2011',
        tx_hash: '0x6cced5d34f79996fc259ec6f83293ba13a3367c9569f0bbf330bf6d9478eab5c',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterFaucetUpgradeable: {
        address: '0xb04CB6c52E73CF3e2753776030CE85a36549c9C2',
        tx_hash: '0x87bc2ddc97fc662085571ea4247cffff32d2270d223bc6c30df9fc02668d1c79',
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
        address: '0xc0c5618f0F3Fa66b496F2940f373DC366d765BAe',
        tx_hash: '0x555ae12fd70764a90de6f7f5314e8373ee2860b456478d7a668991109e7539ce',
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
        address: '0xa195ACcEB1945163160CD5703Ed43E4f78176a54',
        tx_hash: '0x7be47b2690a3c956279e7cfb7b8cc9ae2c4631ced953cf01f9e5369129432e54',
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
        address: '0x6212cb549De37c25071cF506aB7E115D140D9e42',
        tx_hash: '0x0fee5086df113cdd5dd527242bebe8b4061311709d42b53e045b987a930fad3f',
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
        address: '0x6F9679BdF5F180a139d01c598839a5df4860431b',
        tx_hash: '0xd3a2d624d2d4fbcfdf9a92a4ab3997275df069b902387ced907e007c18b2411a',
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
        address: '0xf4AE7E15B1012edceD8103510eeB560a9343AFd3',
        tx_hash: '0x9a11e87af7f5167e7d3e711f240046bffe5367c1e09dc1d9d90721e132536dca',
        version: 0,
        funcSelectors: [ '0xa3e6ba94', '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0x0bF7dE8d71820840063D4B8653Fd3F0618986faF',
        tx_hash: '0xea72e95bf3b1b2bec760737cb189972d34e93656204c34d1e2d024a41c9422d1',
        version: 0,
        funcSelectors: [
          '0x46cb860b',
          '0x877f64e1',
          '0x7c4bd4f9',
          '0x46613c67',
          '0xefe802d7',
          '0x1b20eaef'
        ]
      },
      TrancheNotationUpgradeable: {
        address: '0xc981ec845488b8479539e6B22dc808Fb824dB00a',
        tx_hash: '0x3ad08cc78bd2a75675da4863891e7704d55fdec57ca92429df2a4f33bac4f8fb',
        version: 0,
        funcSelectors: [ '0x4ee843e2', '0xef552f93', '0xd531674b', '0x474866c3' ]
      }
    },
    ExternalLibraries: {
      BurnVerifier: '0xB1c05b498Cb58568B2470369FEB98B00702063dA',
      ZetherVerifier: '0x92A00fc48Ad3dD4A8b5266a8F467a52Ac784fC83',
      libEncryption: '0x2f8D338360D095a72680A943A22fE6a0d398a0B4'
    }
  },  
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
      },
      TrancheNotationUpgradeable: {
        address: '0xC61fF151af6fA8fbe21263C359BDc7fc3211fff6',
        tx_hash: '0xa8dba55ccccfe5acc558e84db64609e82ba0b006f68272b73e07b0440486c94a',
        version: 0,
        funcSelectors: [ '0x4ee843e2', '0xef552f93', '0xd531674b', '0x474866c3' ]
      }
    },
    ExternalLibraries: {
      BurnVerifier: '0x8Af8CEf5EFb57BF8E1632acEFb012672cad0fCc2',
      ZetherVerifier: '0xAda2cfA6Ad6BA1F7be7F1C31cF12e72C95F66b4c',
      libEncryption: '0x88107F0EdC3C1Efe52308852d9E6940924bC5783'
    }
  }
};
