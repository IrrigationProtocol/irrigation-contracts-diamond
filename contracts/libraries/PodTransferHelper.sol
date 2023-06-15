// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

// helper methods for interacting with plots on beanstalk
library PodTransferHelper {
    function getPlotSplittedByFMV(
        uint256 originalPods,
        uint256 plotFMV,
        uint256 offsetFMV,
        uint256 requiredFMV
    ) internal pure returns (uint256 start, uint256 amount, uint256 reserveFMV) {
        uint256 tranferFMV;
        // always offsetFMV <= plotFMV
        uint256 availableFMV = plotFMV - offsetFMV;
        if (requiredFMV >= availableFMV) {
            tranferFMV = availableFMV;
            reserveFMV = requiredFMV - tranferFMV;
            if (offsetFMV == 0) {
                /// @dev in that case, tranfer all pods in the plot
                // ignore this for gas optimization
                // start = 0;
                amount = originalPods;
            }
        } else {
            tranferFMV = requiredFMV;
            // ignore this for gas optimization
            // reserveFMV = 0;
        }
        if (amount == 0) {
            if (offsetFMV != 0) start = (originalPods * offsetFMV) / plotFMV;
            amount = (originalPods * tranferFMV) / plotFMV;
        }
    }
}
