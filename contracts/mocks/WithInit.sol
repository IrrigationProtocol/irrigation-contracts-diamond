// SPDX-License-Identifier: MIT
pragma solidity >=0.7 <0.9;
pragma experimental ABIEncoderV2;

import "../core/SprinklerUpgradeable.sol";

contract SprinklerUpgradeableWithInit is SprinklerUpgradeable {
    constructor(address _beanstalk) payable initializer {
        __Sprinkler_init(_beanstalk);
    }
}
import "../oracles/WaterOracleUpgradeable.sol";

contract WaterOracleUpgradeableWithInit is WaterOracleUpgradeable {
    constructor() payable initializer {
        __WaterOracle_init();
    }
}
import "../core/WaterTowerUpgradeable.sol";

contract WaterTowerUpgradeableWithInit is WaterTowerUpgradeable {
    constructor() payable initializer {
        __WaterTower_init();
    }
}
import "../core/WaterFaucetUpgradeable.sol";

contract WaterFaucetUpgradeableWithInit is WaterFaucetUpgradeable {
    constructor(
        address _stalk,
        address _pods,
        address _fert
    ) payable initializer {
        __WaterFaucet_init(_stalk, _pods, _fert);
    }
}
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/ERC1155Upgradeable.sol";

contract ERC1155UpgradeableWithInit is ERC1155Upgradeable {
    constructor(string memory uri_) payable initializer {
        __ERC1155_init(uri_);
    }
}
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/ERC20Upgradeable.sol";

contract ERC20UpgradeableWithInit is ERC20Upgradeable {
    constructor(string memory name_, string memory symbol_) payable initializer {
        __ERC20_init(name_, symbol_);
    }
}
import "../tokens/WaterUpgradeable.sol";

contract WaterUpgradeableWithInit is WaterUpgradeable {
    constructor() payable initializer {
        __Water_init();
    }
}
import "../mock/MockTokenUpgradeable.sol";

contract MockERC20UpgradeableWithInit is MockERC20Upgradeable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 supply
    ) payable initializer {
        __MockERC20_init(_name, _symbol, supply);
    }
}
import "../mock/Mock1155Upgradeable.sol";

contract Mock1155UpgradeableWithInit is Mock1155Upgradeable {
    constructor() payable initializer {
        __Mock1155_init();
    }
}
import "../oracles/CurveMetaLpOracleUpgradeable.sol";

contract CurveMetaLpOracleUpgradeableWithInit is CurveMetaLpOracleUpgradeable {
    constructor(address _metaPool) payable initializer {
        __CurveMetaLpOracle_init(_metaPool);
    }
}
import "../oracles/BeanOracleUpgradeable.sol";

contract BeanOracleUpgradeableWithInit is BeanOracleUpgradeable {
    constructor(address _beanMetaPool, address _threeCrvPool) payable initializer {
        __BeanOracle_init(_beanMetaPool, _threeCrvPool);
    }
}
