// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @dev Implements functions only used for irrigation protocol

import "./PodTransfer.sol";

contract MockBeanstalk is PodTransfer {
    uint256 public constant MAX_UINT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    mapping(address => uint256) public stalkBalances;

    uint256 public podsIndex;
    uint256 public harvestableIndex;

    function mockSetStalkBalance(address account, uint256 _value) external {
        stalkBalances[account] = _value;
    }

    function mockSetPlot(address account, uint256 id, uint256 amount) external {
        userPods[account].plots[id] = amount;
    }

    function mockSetPodsIndex(uint256 _podsIndex) external {
        podsIndex = _podsIndex;
    }

    function mockSetHarvestableIndex(uint256 _harvestable) external {
        harvestableIndex = _harvestable;
    }

    function balanceOfStalk(address account) external view returns (uint256) {
        return stalkBalances[account];
    }

    function transferPlot(
        address sender,
        address recipient,
        uint256 id,
        uint256 start,
        uint256 end
    ) external payable {
        uint256 amount = userPods[sender].plots[id];
        require(amount > 0, "Field: Plot not owned by user.");
        require(end > start && amount >= end, "Field: Pod range invalid.");
        amount = end - start; // Note: SafeMath is redundant here.
        if (msg.sender != sender && allowancePods(sender, msg.sender) != MAX_UINT) {
            decrementAllowancePods(sender, msg.sender, amount);
        }

        _transferPlot(sender, recipient, id, start, amount);
    }

    function approvePods(address spender, uint256 amount) external payable {
        require(spender != address(0), "Field: Pod Approve to 0 address.");
        setAllowancePods(msg.sender, spender, amount);
        emit PodApproval(msg.sender, spender, amount);
    }

    function plot(address account, uint256 plotId) public view returns (uint256) {
        return userPods[account].plots[plotId];
    }
}
