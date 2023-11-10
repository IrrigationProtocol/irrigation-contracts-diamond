// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../oracles/AggregatorV2V3Interface.sol";

contract MockAggregator {
    address internal aggregator;

    constructor(address _aggregator) {
        aggregator = _aggregator;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        (roundId, answer, startedAt, updatedAt, answeredInRound) = AggregatorV2V3Interface(
            aggregator
        ).latestRoundData();
        return (roundId, answer, startedAt, block.timestamp, answeredInRound);
    }
}
