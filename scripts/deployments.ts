
import { INetworkDeployInfo } from "../scripts/common";
export const deployments: { [key: string]: INetworkDeployInfo } = {
  dev: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x35ea7aa2b9706A05CC932a7350a5E5A7D80619BF',
        tx_hash: '',
        version: 0,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0xff555d8a',
          '0x36568abe', '0xd547741f',
          '0x01ffc9a7'
        ],
        verified: true
      },
      DiamondLoupeFacet: {
        address: '0x48b797C0C717b4389c16a817DC6a85F4DCDd817b',
        tx_hash: '0x372edd98c9d6b0b79bdcd395b3372dd30af20db88fc8a5c035ebe98b51b572e5',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ],
        verified: true
      },
      OwnershipFacet: {
        address: '0xc42dA9d1Ae4595aB62A6C84Fa7e9eBe6c903DE0c',
        tx_hash: '0x62dcbb214ace2edda2dbcc467a8446a62cd9ce7379b28d5bba0198ff3588b747',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ],
        verified: true
      },
      SprinklerUpgradeable: {
        address: '0xf5a070fa06FBA1F2a19FB9EeB39Aca3377AE6372',
        tx_hash: '0xabe6cbb7acd175d40b418894ee7ed9ef6d9d348b9a92b66f6db0aa76fbbac6ae',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ],
        verified: true
      },
      WaterCommonUpgradeable: {
        address: '0x2B45445C9305E6650cc9f135a06EBF3B2F494914',
        tx_hash: '0x2d9799276cf3dd6369e5e03f6bb8c027d5ffb06d0f4af5f742ba978eaed1ebdf',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ],
        verified: true
      },
      WaterTowerUpgradeable: {
        address: '0x21307D63096403b03395448Fdbde0db0a3581fEE',
        tx_hash: '0x35a1399f4de29cf0a0d8d728d2ea8a6c60752e8d904496e70d24a09a4fba41fd',
        version: 0.2,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0x8477a3f4', '0xeedb94a9',
          '0x22c14db9', '0x2f380b35',
          '0xe627f2db', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ]
      },
      WaterUpgradeable: {
        address: '0xf258Fb0c495D539FCb1F509F8Fb382bc1bd38687',
        tx_hash: '0xc8847ac78d1bdc3a8588707b3f78afe51922bcf22ac656d7693a5065a5e7c1d2',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ],
        verified: true
      },
      AuctionUpgradeable: {
        address: '0xCa8BCD94a353Ebb566ff33D470a6865FA81e23F0',
        tx_hash: '0x8780df151ca4153c86323c8b56cafce0562218e79a4a2edd21c353bcd9547f0b',
        version: 0.2,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x32b560db',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x51b5d816',
          '0x808bf40c', '0x4c6fc8e9',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ]
      },
      PodsOracleUpgradeable: {
        address: '0xbc139e4A8260c56EC0AFeA25150C93B435CFc785',
        tx_hash: '0x853b297a08628a503870b592990f67ff346e1d89752e3240fc1d842d472af43c',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ],
        verified: true
      },
      TrancheBondUpgradeable: {
        address: '0x40c325AD0fa4E497F802985936fE26F542845Bd6',
        tx_hash: '0x29a86819fe7a4a11dd1eee55bb41ed1fd2e7a126882e24d938eab310f3fcf3f0',
        version: 0,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ],
        verified: true
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x28be1A970CBfB88d8CE438B439d818Dcae1a7D81',
        tx_hash: '0x8492242f3df92d6bbb298a21cf297cc53655007f5b8656192a794a6fafae0038',
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
        ],
        verified: true
      },
      PriceOracleUpgradeable: {
        address: '0xc4D1848D4740f915dB4c6Ea9DBF02C04d0A7a27E',
        tx_hash: '0xa9a23bda303560f8b17f13072b2139bf9aa902a4613f7417baeed5dc1c08e4b0',
        version: 0,
        funcSelectors: [
          '0xea0129ca',
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0'
        ],
        verified: true
      },
      IrrigationControlUpgradeable: {
        address: '0x1cF17743cFd3e8A2FF272d3da927a7956b3f2163',
        tx_hash: '0x3fd4a6f9d1e26de897807dc4a611dae888e4b1c99f2b2c90eab4909500fa39e5',
        version: 0.2,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0xa88abf73',
          '0x50ca7655',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5',
          '0xdd5e83b8'
        ]
      }
    },
    ExternalLibraries: { UniswapV3Twap: '0xf255AB88e6b4C825D465DA5eBB13c6A27e89367C' }
  },
  goerli: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x2F1f9A7b95675B3e702B16B551fE67c94751428E',
        tx_hash: '0xc251af75761b586edd7c5ab3191b88edb90b80d5637ae8eed99fcc61d713ef3d',
        version: 0.1,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0x36568abe',
          '0xd547741f', '0x01ffc9a7'
        ]
      },
      DiamondLoupeFacet: {
        address: '0xf255AB88e6b4C825D465DA5eBB13c6A27e89367C',
        tx_hash: '0x0207b84b0b54f976d8bc0bcc80828ed8810378aff74c2ac1afcd7391ae4542f8',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ],
        verified: true
      },
      OwnershipFacet: {
        address: '0x48b797C0C717b4389c16a817DC6a85F4DCDd817b',
        tx_hash: '0x78ad11a9bc13f5e1fe792147fb509ebd5c447c6fc4b589f6ffaaa223436fb336',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ],
        verified: true
      },
      SprinklerUpgradeable: {
        address: '0xc42dA9d1Ae4595aB62A6C84Fa7e9eBe6c903DE0c',
        tx_hash: '0xf323a8783137ecd2a59c51e288c49c83c6291eb7eeec16460317b2e25970577b',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ],
        verified: true
      },
      WaterCommonUpgradeable: {
        address: '0xf5a070fa06FBA1F2a19FB9EeB39Aca3377AE6372',
        tx_hash: '0xa309e8fad3491e3270345445dfc03da75dedfcf842fba62e69a43dc6633e7ece',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ],
        verified: true
      },
      WaterTowerUpgradeable: {
        address: '0x2B45445C9305E6650cc9f135a06EBF3B2F494914',
        tx_hash: '0xdf1bf096ce444a4bf9cc40ea513d37e14a47e0d77519520bb761b9b85ce89815',
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
        ],
        verified: true
      },
      WaterUpgradeable: {
        address: '0x768FA9e240D55EDCaBEdB658896b872d7862dB1e',
        tx_hash: '0x35e1307407192264efd7f7831dd42a648bf0d97c1262c42609f15e550c8fa23d',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ],
        verified: true
      },
      AuctionUpgradeable: {
        address: '0xf258Fb0c495D539FCb1F509F8Fb382bc1bd38687',
        tx_hash: '0xda7f3f0d9df8d038045062c3b8c85f026d361fe43dbc4c80ef5187f0e7444041',
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
        ],
        verified: true
      },
      PodsOracleUpgradeable: {
        address: '0xB4EfBC620a529b805854806568009a98213884C8',
        tx_hash: '0xa2c948b7ae44b3801345bb610fabf6b658410d7e7459ed4c1138ea82aeaa565f',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ],
        verified: true
      },
      TrancheBondUpgradeable: {
        address: '0xbc139e4A8260c56EC0AFeA25150C93B435CFc785',
        tx_hash: '0x1527d1d4fb5393150d48f29fc375e48315d353110643566753099cae97de233e',
        version: 0,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ],
        verified: true
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x40c325AD0fa4E497F802985936fE26F542845Bd6',
        tx_hash: '0x2ef51e7a7152c124fb2302987785f278df41d0b08cbd05cd7ff11a4c5ff3e54d',
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
        ],
        verified: true
      },
      PriceOracleUpgradeable: {
        address: '0x28be1A970CBfB88d8CE438B439d818Dcae1a7D81',
        tx_hash: '0x9e8f5592b5fae9bede774bcda67020dce1fde655de9e198acd2030764e605817',
        version: 0,
        funcSelectors: [
          '0xea0129ca',
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0'
        ],
        verified: true
      },
      IrrigationControlUpgradeable: {
        address: '0xc4D1848D4740f915dB4c6Ea9DBF02C04d0A7a27E',
        tx_hash: '0x4c17514664a7c93fc2ca408f5b08827bf01e75f2b8b0e2694820b78ea68bfd5c',
        version: 0,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0x54fdbe1a',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5'
        ],
        verified: true
      }
    },
    FactoryAddress: '0x14E7558B76569be517fD48441D8F83564AE5a780',
    ExternalLibraries: { UniswapV3Twap: '0x243d7F8C976574996963a3C30d0aD9C705F296Ee' }
  },
  mainnet: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x35ea7aa2b9706A05CC932a7350a5E5A7D80619BF',
        tx_hash: '',
        version: 0,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0xff555d8a',
          '0x36568abe', '0xd547741f',
          '0x01ffc9a7'
        ],
        verified: true
      },
      DiamondLoupeFacet: {
        address: '0x48b797C0C717b4389c16a817DC6a85F4DCDd817b',
        tx_hash: '0x372edd98c9d6b0b79bdcd395b3372dd30af20db88fc8a5c035ebe98b51b572e5',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ],
        verified: true
      },
      OwnershipFacet: {
        address: '0xc42dA9d1Ae4595aB62A6C84Fa7e9eBe6c903DE0c',
        tx_hash: '0x62dcbb214ace2edda2dbcc467a8446a62cd9ce7379b28d5bba0198ff3588b747',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ],
        verified: true
      },
      SprinklerUpgradeable: {
        address: '0xf5a070fa06FBA1F2a19FB9EeB39Aca3377AE6372',
        tx_hash: '0xabe6cbb7acd175d40b418894ee7ed9ef6d9d348b9a92b66f6db0aa76fbbac6ae',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ],
        verified: true
      },
      WaterCommonUpgradeable: {
        address: '0x2B45445C9305E6650cc9f135a06EBF3B2F494914',
        tx_hash: '0x2d9799276cf3dd6369e5e03f6bb8c027d5ffb06d0f4af5f742ba978eaed1ebdf',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ],
        verified: true
      },
      WaterTowerUpgradeable: {
        address: '0x21307D63096403b03395448Fdbde0db0a3581fEE',
        tx_hash: '0x151e721306703e0995322248dbe10dad6b5e567259454aa1cb8c567bb674a6a5',
        version: 0.2,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0x8477a3f4', '0xeedb94a9',
          '0x22c14db9', '0x2f380b35',
          '0xe627f2db', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ],
        verified: true
      },
      WaterUpgradeable: {
        address: '0xf258Fb0c495D539FCb1F509F8Fb382bc1bd38687',
        tx_hash: '0xc8847ac78d1bdc3a8588707b3f78afe51922bcf22ac656d7693a5065a5e7c1d2',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ],
        verified: true
      },
      AuctionUpgradeable: {
        address: '0xCa8BCD94a353Ebb566ff33D470a6865FA81e23F0',
        tx_hash: '0x3ee66f425f8eb06f407f21c50f86b586ca98121d9b9576fa622dc0606ec38f89',
        version: 0.2,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x32b560db',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x51b5d816',
          '0x808bf40c', '0x4c6fc8e9',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ],
        verified: true
      },
      PodsOracleUpgradeable: {
        address: '0xbc139e4A8260c56EC0AFeA25150C93B435CFc785',
        tx_hash: '0x853b297a08628a503870b592990f67ff346e1d89752e3240fc1d842d472af43c',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ],
        verified: true
      },
      TrancheBondUpgradeable: {
        address: '0x1cF17743cFd3e8A2FF272d3da927a7956b3f2163',
        tx_hash: '0x07eb2395a0a22214457076cdcc6cc3a36d758c01580b922e85545564781e98e4',
        version: 0.2,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ],
        verified: true
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x28be1A970CBfB88d8CE438B439d818Dcae1a7D81',
        tx_hash: '0x8492242f3df92d6bbb298a21cf297cc53655007f5b8656192a794a6fafae0038',
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
        ],
        verified: true
      },
      PriceOracleUpgradeable: {
        address: '0xc8A0e5609c736f999A3187A23b43f6D592674929',
        tx_hash: '0xdff7e0b0067cb5901f011f03593c6f3c17ce090e6f9a8c2b2b1c317e187f1d16',
        version: 0.2,
        funcSelectors: [
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0',
          '0x46093b0e'
        ],
        verified: true
      },
      IrrigationControlUpgradeable: {
        address: '0x229620Fe6F0e9a25D4f23D8B615a876Edf12932B',
        tx_hash: '0x883a6715272fc65fe41a8bc763a642e114c2ea011a963336dfb85f25bb567e7e',
        version: 0.2,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0xa88abf73',
          '0x50ca7655',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5',
          '0xdd5e83b8'
        ],
        verified: true
      }
    },
    ExternalLibraries: { UniswapV3Twap: '0xf255AB88e6b4C825D465DA5eBB13c6A27e89367C' }
  },
  hardhat: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x35ea7aa2b9706A05CC932a7350a5E5A7D80619BF',
        tx_hash: '',
        version: 0,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0xff555d8a',
          '0x36568abe', '0xd547741f',
          '0x01ffc9a7'
        ],
        verified: true
      },
      DiamondLoupeFacet: {
        address: '0x48b797C0C717b4389c16a817DC6a85F4DCDd817b',
        tx_hash: '0x372edd98c9d6b0b79bdcd395b3372dd30af20db88fc8a5c035ebe98b51b572e5',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ],
        verified: true
      },
      OwnershipFacet: {
        address: '0xc42dA9d1Ae4595aB62A6C84Fa7e9eBe6c903DE0c',
        tx_hash: '0x62dcbb214ace2edda2dbcc467a8446a62cd9ce7379b28d5bba0198ff3588b747',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ],
        verified: true
      },
      SprinklerUpgradeable: {
        address: '0xf5a070fa06FBA1F2a19FB9EeB39Aca3377AE6372',
        tx_hash: '0xabe6cbb7acd175d40b418894ee7ed9ef6d9d348b9a92b66f6db0aa76fbbac6ae',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ],
        verified: true
      },
      WaterCommonUpgradeable: {
        address: '0x2B45445C9305E6650cc9f135a06EBF3B2F494914',
        tx_hash: '0x2d9799276cf3dd6369e5e03f6bb8c027d5ffb06d0f4af5f742ba978eaed1ebdf',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ],
        verified: true
      },
      WaterTowerUpgradeable: {
        address: '0x21307D63096403b03395448Fdbde0db0a3581fEE',
        tx_hash: '0x151e721306703e0995322248dbe10dad6b5e567259454aa1cb8c567bb674a6a5',
        version: 0.2,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0x8477a3f4', '0xeedb94a9',
          '0x22c14db9', '0x2f380b35',
          '0xe627f2db', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ],
        verified: true
      },
      WaterUpgradeable: {
        address: '0xf258Fb0c495D539FCb1F509F8Fb382bc1bd38687',
        tx_hash: '0xc8847ac78d1bdc3a8588707b3f78afe51922bcf22ac656d7693a5065a5e7c1d2',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ],
        verified: true
      },
      AuctionUpgradeable: {
        address: '0xCa8BCD94a353Ebb566ff33D470a6865FA81e23F0',
        tx_hash: '0x3ee66f425f8eb06f407f21c50f86b586ca98121d9b9576fa622dc0606ec38f89',
        version: 0.2,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x32b560db',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x51b5d816',
          '0x808bf40c', '0x4c6fc8e9',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ],
        verified: true
      },
      PodsOracleUpgradeable: {
        address: '0xbc139e4A8260c56EC0AFeA25150C93B435CFc785',
        tx_hash: '0x853b297a08628a503870b592990f67ff346e1d89752e3240fc1d842d472af43c',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ],
        verified: true
      },
      TrancheBondUpgradeable: {
        address: '0x1cF17743cFd3e8A2FF272d3da927a7956b3f2163',
        tx_hash: '0x07eb2395a0a22214457076cdcc6cc3a36d758c01580b922e85545564781e98e4',
        version: 0.2,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ],
        verified: true
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x28be1A970CBfB88d8CE438B439d818Dcae1a7D81',
        tx_hash: '0x8492242f3df92d6bbb298a21cf297cc53655007f5b8656192a794a6fafae0038',
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
        ],
        verified: true
      },
      PriceOracleUpgradeable: {
        address: '0xc8A0e5609c736f999A3187A23b43f6D592674929',
        tx_hash: '0xdff7e0b0067cb5901f011f03593c6f3c17ce090e6f9a8c2b2b1c317e187f1d16',
        version: 0.2,
        funcSelectors: [
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0',
          '0x46093b0e'
        ],
        verified: true
      },
      IrrigationControlUpgradeable: {
        address: '0x229620Fe6F0e9a25D4f23D8B615a876Edf12932B',
        tx_hash: '0x883a6715272fc65fe41a8bc763a642e114c2ea011a963336dfb85f25bb567e7e',
        version: 0.2,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0xa88abf73',
          '0x50ca7655',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5',
          '0xdd5e83b8'
        ],
        verified: true
      }
    },
    ExternalLibraries: { UniswapV3Twap: '0xf255AB88e6b4C825D465DA5eBB13c6A27e89367C' }
  },
  local: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x35ea7aa2b9706A05CC932a7350a5E5A7D80619BF',
        tx_hash: '',
        version: 0,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0xff555d8a',
          '0x36568abe', '0xd547741f',
          '0x01ffc9a7'
        ],
        verified: true
      },
      DiamondLoupeFacet: {
        address: '0x48b797C0C717b4389c16a817DC6a85F4DCDd817b',
        tx_hash: '0x372edd98c9d6b0b79bdcd395b3372dd30af20db88fc8a5c035ebe98b51b572e5',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ],
        verified: true
      },
      OwnershipFacet: {
        address: '0xc42dA9d1Ae4595aB62A6C84Fa7e9eBe6c903DE0c',
        tx_hash: '0x62dcbb214ace2edda2dbcc467a8446a62cd9ce7379b28d5bba0198ff3588b747',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ],
        verified: true
      },
      SprinklerUpgradeable: {
        address: '0xf5a070fa06FBA1F2a19FB9EeB39Aca3377AE6372',
        tx_hash: '0xabe6cbb7acd175d40b418894ee7ed9ef6d9d348b9a92b66f6db0aa76fbbac6ae',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ],
        verified: true
      },
      WaterCommonUpgradeable: {
        address: '0x2B45445C9305E6650cc9f135a06EBF3B2F494914',
        tx_hash: '0x2d9799276cf3dd6369e5e03f6bb8c027d5ffb06d0f4af5f742ba978eaed1ebdf',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ],
        verified: true
      },
      WaterTowerUpgradeable: {
        address: '0x21307D63096403b03395448Fdbde0db0a3581fEE',
        tx_hash: '0x151e721306703e0995322248dbe10dad6b5e567259454aa1cb8c567bb674a6a5',
        version: 0.2,
        funcSelectors: [
          '0x41f894ff', '0xc5e78556',
          '0x23eb4574', '0x379607f5',
          '0x9a408321', '0x775def35',
          '0x8477a3f4', '0xeedb94a9',
          '0x22c14db9', '0x2f380b35',
          '0xe627f2db', '0xd0a2b314',
          '0x62c799a9', '0x92eb6da5',
          '0x297a5edf', '0x46430af1',
          '0x7d882097', '0xe7d7f14d',
          '0x1959a002', '0x2e1a7d4d'
        ],
        verified: true
      },
      WaterUpgradeable: {
        address: '0xf258Fb0c495D539FCb1F509F8Fb382bc1bd38687',
        tx_hash: '0xc8847ac78d1bdc3a8588707b3f78afe51922bcf22ac656d7693a5065a5e7c1d2',
        version: 0,
        funcSelectors: [
          '0xd6c5362e', '0xdd62ed3e',
          '0x095ea7b3', '0x70a08231',
          '0x313ce567', '0xa457c2d7',
          '0x39509351', '0x06fdde03',
          '0x95d89b41', '0x18160ddd',
          '0xa9059cbb', '0x23b872dd'
        ],
        verified: true
      },
      AuctionUpgradeable: {
        address: '0xCa8BCD94a353Ebb566ff33D470a6865FA81e23F0',
        tx_hash: '0x3ee66f425f8eb06f407f21c50f86b586ca98121d9b9576fa622dc0606ec38f89',
        version: 0.2,
        funcSelectors: [
          '0xd14228d3', '0xc34a7336',
          '0x236ed8f3', '0x8f031880',
          '0x78bd7935', '0x32b560db',
          '0xca039017', '0xe45c1879',
          '0x582c7ffd', '0xa6523f8f',
          '0x4c1cafc6', '0x51b5d816',
          '0x808bf40c', '0x4c6fc8e9',
          '0x76741bb9', '0x5e06f72b',
          '0xe47fd1f1'
        ],
        verified: true
      },
      PodsOracleUpgradeable: {
        address: '0xbc139e4A8260c56EC0AFeA25150C93B435CFc785',
        tx_hash: '0x853b297a08628a503870b592990f67ff346e1d89752e3240fc1d842d472af43c',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ],
        verified: true
      },
      TrancheBondUpgradeable: {
        address: '0x1cF17743cFd3e8A2FF272d3da927a7956b3f2163',
        tx_hash: '0x07eb2395a0a22214457076cdcc6cc3a36d758c01580b922e85545564781e98e4',
        version: 0.2,
        funcSelectors: [
          '0x3bf5e1e4',
          '0xd6f5e33f',
          '0xddd17fa9',
          '0x1b20eaef',
          '0x6f84303b',
          '0xa8ff2cb5'
        ],
        verified: true
      },
      ERC1155WhitelistUpgradeable: {
        address: '0x28be1A970CBfB88d8CE438B439d818Dcae1a7D81',
        tx_hash: '0x8492242f3df92d6bbb298a21cf297cc53655007f5b8656192a794a6fafae0038',
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
        ],
        verified: true
      },
      PriceOracleUpgradeable: {
        address: '0xc8A0e5609c736f999A3187A23b43f6D592674929',
        tx_hash: '0xdff7e0b0067cb5901f011f03593c6f3c17ce090e6f9a8c2b2b1c317e187f1d16',
        version: 0.2,
        funcSelectors: [
          '0xd63c570b',
          '0x41976e09',
          '0x84a2ce13',
          '0x7d848fec',
          '0x09a8acb0',
          '0x4680bab0',
          '0x46093b0e'
        ],
        verified: true
      },
      IrrigationControlUpgradeable: {
        address: '0x229620Fe6F0e9a25D4f23D8B615a876Edf12932B',
        tx_hash: '0x883a6715272fc65fe41a8bc763a642e114c2ea011a963336dfb85f25bb567e7e',
        version: 0.2,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0xa88abf73',
          '0x50ca7655',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5',
          '0xdd5e83b8'
        ],
        verified: true
      }
    },
    ExternalLibraries: { UniswapV3Twap: '0xf255AB88e6b4C825D465DA5eBB13c6A27e89367C' }
  }
};
