// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";

contract WaterCommonUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using WaterCommonStorage for WaterCommonStorage.Layout;

    function WaterCommon_Initialize(address _beanstalk, address _fertilizer) public EIP2535Initializer onlySuperAdminRole {
        __WaterCommon_init(_beanstalk, _fertilizer);
    }

    function __WaterCommon_init(address _beanstalk, address _fertilizer) internal onlyInitializing {
        __IrrigationAccessControl_init_unchained();
        require(
            _beanstalk != address(0) &&
            _fertilizer != address(0),
            "Cannot specify zero addr for parameters"
        );

        WaterCommonStorage.layout().beanstalk = IBeanstalkUpgradeable(_beanstalk);
        WaterCommonStorage.layout().fertilizer = IERC1155Upgradeable(_fertilizer);

    }

    // generated getter for stalkToken
    function beanstalk() public view returns(IBeanstalkUpgradeable) {
        return WaterCommonStorage.layout().beanstalk;
    }

    // generated getter for fertToken
    function fertilizer() public view returns(IERC1155Upgradeable) {
        return WaterCommonStorage.layout().fertilizer;
    }
}