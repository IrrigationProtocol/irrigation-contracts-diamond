// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface IBeanstalk {
    function transferPlot(
        address sender,
        address recipient,
        uint256 id,
        uint256 start,
        uint256 end
    ) external;
}
