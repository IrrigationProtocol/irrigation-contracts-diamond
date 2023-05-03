// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../../core/WaterCommonUpgradeable.sol";
import "../../core/WaterCommonStorage.sol";

contract MockWaterCommonUpgradeable is WaterCommonUpgradeable {
    using WaterCommonStorage for WaterCommonStorage.Layout;

    function mockSetBeanstalk(address _beanstalk, address _fertilizer) external {
        require(
            _beanstalk != address(0) &&
            _fertilizer != address(0),
            "Cannot specify zero addr for parameters"
        );

        WaterCommonStorage.layout().beanstalk = IBeanstalkUpgradeable(_beanstalk);
        WaterCommonStorage.layout().fertilizer = IERC1155Upgradeable(_fertilizer);

    }
}
