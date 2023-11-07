// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

interface IMulticall2 {
    struct Call {
        address target;
        bytes callData;
    }
    struct Result {
        bool success;
        bytes returnData;
    }

    function tryAggregate(
        bool requireSuccess,
        Call[] memory calls
    ) external view returns (Result[] memory returnData);
}
