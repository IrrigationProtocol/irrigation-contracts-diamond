
import { INetworkDeployInfo } from "../scripts/common";
export const deployments: { [key: string]: INetworkDeployInfo } = {
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
  },
  local: {
    DiamondAddress: '0x66765c83edd9042E4AAf45217902f709635e0466',
    DeployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        tx_hash: '0x266073529b4abbabf0815fafe304749225ef13e99e2f9306044d122e3e84c512',
        version: 0,
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
        address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        tx_hash: '0xbd1ebe1f09ffe12cbccde1daa25d17f4e6672077c3645ffef89f9bde9092969f',
        version: 0,
        funcSelectors: [ '0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627' ]
      },
      OwnershipFacet: {
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        tx_hash: '0xa73bfc664ebe2d225bbd7746d4e1e81a197f56403f3a1bd9c4d71e03397c50ef',
        version: 0,
        funcSelectors: [ '0x8da5cb5b', '0xf2fde38b' ]
      },
      SprinklerUpgradeable: {
        address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        tx_hash: '0x3ff820b3bfd0a8c9c931ed0081f6e5fbc403ddb7d69eb656a5ae1bfb797688b5',
        version: 0,
        funcSelectors: [
          '0xa6b4fc9a', '0x0c427550',
          '0xa09dc7a6', '0x51763ea0',
          '0xb387ad93', '0x4e2f37d5',
          '0xd01f63f5', '0x5c975abb',
          '0x6f992a45', '0xd555fd78',
          '0xb2dc23c3', '0x6b1f8ac5',
          '0x01e33667'
        ]
      },
      WaterCommonUpgradeable: {
        address: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
        tx_hash: '0x04bd0df9d9069416a0dab46ebe00acdbe52a94d441ef47fdad7c39621d384ac5',
        version: 0,
        funcSelectors: [ '0xab967b8d', '0x3a2b6901', '0x74c7c578' ]
      },
      WaterTowerUpgradeable: {
        address: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        tx_hash: '0xeb4473dddf6f47c3ce8b7823c2ff4e90cfcf71d437c7dccf0a8ac991cabb6cad',
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
        address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
        tx_hash: '0x66505d6181fdf321c4ee1ea21f9052c80ae90fd5aea00ab4a1a3b7f9397d2918',
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
        address: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
        tx_hash: '0x2da3fb5ed4f697def20351da87788a790248b3d71520ba1bd5c617ed8dc29063',
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
        address: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
        tx_hash: '0x79570fb8c8a9d00120d1e32c04b0cb7858fecd53a2ff69e98825c234073183c1',
        version: 0,
        funcSelectors: [ '0xd8246d43', '0x42919ce3' ]
      },
      TrancheBondUpgradeable: {
        address: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
        tx_hash: '0xa89cf269fc9c25171ef2d08b98f3e10c2269187e88faa72a91bb4f8d71494776',
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
        address: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
        tx_hash: '0xf9225674e5859fc83f39cabf28a3d16d7f1cb1dfa5bac4e12c797406cebafe3d',
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
        address: '0x9A676e781A523b5d0C0e43731313A708CB607508',
        tx_hash: '0x72111b11fc24612025f9db2a4f85ecd6f5bd97091e4d0ab72db6aa8a9595b067',
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
        address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
        tx_hash: '0xd9da244688555d74a82a293b49166c4e22f8488e520b7663a1953c45f51366f2',
        version: 0,
        funcSelectors: [
          '0xcb3597d8',
          '0x8456cb59',
          '0x54fdbe1a',
          '0x49981ef5',
          '0x3f4ba83a',
          '0x3a46153e',
          '0x733754e5'
        ]
      }
    },
    FactoryAddress: '0x14E7558B76569be517fD48441D8F83564AE5a780',
    ExternalLibraries: { UniswapV3Twap: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' }
  },
  goerli: {
    DiamondAddress: '0x251FAe8f687545BDD462Ba4FCDd7581051740463',
    DeployerAddress: '0x9249E360Dc6f4D2871187acDE4Fe38D4e13a7703',
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: '0x35ea7aa2b9706A05CC932a7350a5E5A7D80619BF',
        tx_hash: '0xad41bb9559c2d26ed2797ffbb15dfc84fec543fdd9ba0de961f354d3c0464c38',
        version: 0,
        funcSelectors: [
          '0x75b238fc', '0x5effdd20',
          '0xa217fddf', '0x1f931c1c',
          '0x248a9ca3', '0x9010d07c',
          '0xca15c873', '0x2f2ff15d',
          '0x91d14854', '0x36568abe',
          '0xd547741f', '0x01ffc9a7'
        ],
        verified: true
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
  }
};
