## Audit Reference (V1)
1. following files is already audited from other projects, so we don't need audit for these files and folders.

   | Files                                    |                       description                  |
   | ---------------------------------------- | :------------------------------------------------: |
   | /libraries/TransferHelper.sol            | fetched from uniswap v2 github and audited already |
   | /interfaces/IERC173Upgradeable.sol       | @gnus.ai/contracts-upgradeable-diamond v4.8.1      |
   | /beanstalk/IBeanstalkUpgradeable.sol     | Beanstalk protocol                                 |


2. this files should be auditted

   | Core Facets                              |
   | ---------------------------------------- |
   | core/SprinklerUpgradeable.sol            |     
   | core/WaterTowerUpgradeable.sol           |
   | core/TrancheBondUpgradeable.sol          | 
   | core/AuctionUpgradeable.sol              |
   
   | Base Components Facets                   |
   | ---------------------------------------- |
   | core/ERC1155WhitelistUpgradeable.sol     |
   | core/WaterCommonUpgradeable.sol          |
   | oracles/PriceOralcleUpgradeable.sol      |
   | oracles/PodsOralcleUpgradeable.sol       |

   | Utility Token Facet                      |
   | ---------------------------------------- |
   | tokens/WaterUpgradeable.sol              |

   | Core Storage Libraries                   |
   | ---------------------------------------- |   
   | core/SprinklerStorage.sol                |
   | core/WaterTowerStorage.sol               |
   | core/TrancheBondStorage.sol              |
   | core/AuctionStorage.sol                  |
   | core/ERC1155WhitelistStorage.sol         |
   | core/WaterCommonStorage.sol              |
   | oracles/PriceOralcleStorage.sol          |
   
   | Diamond standard                         |
   | ---------------------------------------- |   
   | IrrigationDiamond.sol                    |
   | utils/Diamond.sol                        |
   | utils/DiamondCutFacet.sol                |
   | utils/DiamondLoupeFacet.sol              |
   | utils/EIP2535Initializable.sol           |
   | utils/IrrigationAccessControl.sol        |
   | utils/OwnershipFacet.sol                 |

   | Utility and Oracle Libraries             |
   | ---------------------------------------- |   
   | libraries/FullMath.sol                   |
   | libraries/PodTransferHelper.sol          |
   | libraries/Oracle/LibPrice.sol            |
   | oracles/BeanPriceOracle.sol              |
   | oracles/ChainlinkOracle.sol              |
   | oracles/uniswapv3/UniswapV3Twap.sol      |
   | oracles/AggregatorV2V3Interface.sol      |

   | Interfaces                               |
   | ---------------------------------------- |   
   | interfaces/*.*                           |
   | curve/*.*                                |
   

3. this files are on development, so don't need audit

   | Core facets                              |
   | ---------------------------------------- |
   | core/BannedTransferorList.sol            |
   | core/BanTransferor.sol                   |
   | core/WaterFaucetUpgradeable.sol          |
   | core/ZSCStorage.sol                      |
   | core/ZSCUpgradeable.sol                  |

   | libraries                                |
   | --------------------------------------   |
   | libraries/Encryption/libEncryption.sol   |
   | libraries/ZkVerifier/*.*                 |
   | utils/Utils.sol                          |
   


