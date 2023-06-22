## Audit Reference (V1)
1. following files is already audited from other projects, so we don't need audit for these files and folders.

   | Files                                    |                       description                  |
   | ---------------------------------------- | :------------------------------------------------: |
   | /libraries/TransferHelper.sol            | fetched from uniswap v2 github and audited already |
   | /interfaces/IERC173Upgradeable.sol       | @gnus.ai/contracts-upgradeable-diamond v4.8.1      |
   | /beanstalk/IBeanstalkUpgradeable.sol     | Beanstalk protocol                                 |


2. this files should be auditted

   | Core facets                              |
   | ---------------------------------------- |
   | core/AuctionStorage.sol                  |
   | core/AuctionUpgradeable.sol              |
   | core/ERC1155WhitelistStorage.sol         |
   | core/ERC1155WhitelistUpgradeable.sol     |
   | core/SprinklerStorage.sol                |
   | core/SprinklerUpgradeable.sol            |
   | core/TrancheBondStorage.sol              |
   | core/TrancheBondUpgradeable.sol          |
   | core/WaterCommonStorage.sol              |
   | core/WaterCommonUpgradeable.sol          |
   | core/WaterTowerStorage.sol               |
   | core/WaterTowerUpgradeable.sol           |
   | tokens/WaterUpgradeable.sol              |
   | oracles/PriceOralcleStorage.sol          |
   | oracles/PriceOralcleUpgradeable.sol      |
   | oracles/PodsOralcleUpgradeable.sol       |
      

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
   | libraries/ZkVerifier/*.sol               |
   


