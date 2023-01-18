// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/ERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/proxy/utils/Initializable.sol";

contract WaterUpgradeable is Initializable, ERC20Upgradeable {
    /**
     * @notice Mint 100 millions WATER.
     */
    function __Water_init() internal onlyInitializing {
        __ERC20_init_unchained("Water Token", "WATER");
        __Water_init_unchained();
    }

    function __Water_init_unchained() internal onlyInitializing {
        _mint(msg.sender, 100000000e18);
    }
}
