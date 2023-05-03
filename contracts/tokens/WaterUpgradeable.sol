// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/ERC20Upgradeable.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";

contract WaterUpgradeable is EIP2535Initializable, ERC20Upgradeable, IrrigationAccessControl {

    function Water_Initialize() public initializer onlySuperAdminRole {
        __Water_init();
        LibDiamond.diamondStorage().supportedInterfaces[type(IERC20Upgradeable).interfaceId] = true;
    }

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
