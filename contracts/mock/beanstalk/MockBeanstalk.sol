// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// import "../../beanstalk/IBeanstalkUpgradeable.sol";

contract MockBeanstalk /* is IBeanstalkUpgradeable */ {
    mapping(address => uint256) stalkBalances;

    function mockSetStalkBalance(address account, uint256 _value) external {
        stalkBalances[account] = _value;
    }

    function balanceOfStalk(address account)
        external
        view
        returns (uint256)
    {
        return stalkBalances[account];
    }

    function transferPlot(
        address sender,
        address recipient,
        uint256 id,
        uint256 start,
        uint256 end
    ) external payable {}
}
