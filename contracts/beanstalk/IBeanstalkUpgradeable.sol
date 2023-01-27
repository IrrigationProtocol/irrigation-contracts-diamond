// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IBeanstalkUpgradeable {
    function transferPlot(
        address sender,
        address recipient,
        uint256 id,
        uint256 start,
        uint256 end
    ) external payable;

    function balanceOfStalk(address account) external view returns (uint256);
}
