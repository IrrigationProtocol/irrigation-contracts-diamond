
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
  },
  dev: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x44863F234b137A395e5c98359d16057A9A1fAc55',
        tx_hash: '0x2b19393b898f8c15afe11a53660c1c565e9cc8562f149ceefe11961ba1a5d896',
        version: 0,
        funcSelectors: [ '0x1f931c1c' ]
      },
      DiamondLoupeFacet: {
        address: '0xf4AE7E15B1012edceD8103510eeB560a9343AFd3',
        tx_hash: '0x9d4fa124565280baeb19e5bcb1caf547fbdb1656e7ad38ff48e8aca93065d6f8',
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
        address: '0x0bF7dE8d71820840063D4B8653Fd3F0618986faF',
        tx_hash: '0x7621f89864aedb58f4bdd5b48be8276f933684aafda8a633c50a5b9f2f0804bc',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0xc981ec845488b8479539e6B22dc808Fb824dB00a',
        tx_hash: '0xcf74d3ff4be152d66fcf8eca6e7a561704d6e5a2ef1db63b3119000f3453fbdf',
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
        address: '0x5E5713a0d915701F464DEbb66015adD62B2e6AE9',
        tx_hash: '0xc9aea752c78328ad14b50fbe5e8d935a91c2d89e82bf3db433e75bf67066808e',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterFaucetUpgradeable: {
        address: '0x97fd63D049089cd70D9D139ccf9338c81372DE68',
        tx_hash: '0x12cb04e310774abba12428851040f35bbd8b8de0691e88f4ddeb3a10c6c4dc97',
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
        address: '0xC0BF43A4Ca27e0976195E6661b099742f10507e5',
        tx_hash: '0xb884c8bf7e85ed94b3df5a21997100cdf3f1fd1b6eb93b73065ef2e3c0a92edd',
        version: 0,
        funcSelectors: [
          '0x6d573da7', '0x379607f5',
          '0x9a408321', '0xeedb94a9',
          '0xa71ca78a', '0x62c799a9',
          '0x297a5edf', '0xfae6c61e',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0x43cA9bAe8dF108684E5EAaA720C25e1b32B0A075',
        tx_hash: '0xfd2e15a0e2eecc250f6fbeb7a718318e6c02f28c22e0b3c3b3d65f937e43b540',
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
        address: '0x9D3DA37d36BB0B825CD319ed129c2872b893f538',
        tx_hash: '0xdb5f438ef19c7cb4cbffd78ceba1a194621bba27d629d025aa79e45cddecafbd',
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
        address: '0x59C4e2c6a6dC27c259D6d067a039c831e1ff4947',
        tx_hash: '0xcd267e560bfa87c95554286e5a9d1bd695864979adee8454f4799a9aa411d5f9',
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
        address: '0x9d136eEa063eDE5418A6BC7bEafF009bBb6CFa70',
        tx_hash: '0x87b476296bf2dc2d4b79427f00bf293e85e73c5f4506e49e3f8e3da7f95f35ca',
        version: 0,
        funcSelectors: [ '0xa3e6ba94', '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0x687bB6c57915aa2529EfC7D2a26668855e022fAE',
        tx_hash: '0xb2c8ed9b2de5f535512c79fe925c85751428556ba1f361bdd2edc94ae790c33c',
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
        address: '0x49149a233de6E4cD6835971506F47EE5862289c1',
        tx_hash: '0xe1386538f539657753294c1ec8c9cea1879a2a4ae7a0cf815bde69b9b3e6f2b5',
        version: 0,
        funcSelectors: [ '0x4ee843e2', '0xef552f93', '0xd531674b', '0x474866c3' ]
      },
      PriceOracleUpgradeable: {
        address: '0xAe2563b4315469bF6bdD41A6ea26157dE57Ed94e',
        tx_hash: '0x69147babc12f1a445597257f8326d26042f0d1fab0b41f507d49b293ce45a785',
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
      BurnVerifier: '0xc0c5618f0F3Fa66b496F2940f373DC366d765BAe',
      ZetherVerifier: '0xa195ACcEB1945163160CD5703Ed43E4f78176a54',
      libEncryption: '0x6212cb549De37c25071cF506aB7E115D140D9e42',
      UniswapV3Twap: '0x6F9679BdF5F180a139d01c598839a5df4860431b'
    }
  }
};
