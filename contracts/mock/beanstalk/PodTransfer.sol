// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @author Publius
 * @title Pod Transfer
 **/

abstract contract PodTransfer {
    event PlotTransfer(address indexed from, address indexed to, uint256 indexed id, uint256 pods);
    event PodApproval(address indexed owner, address indexed spender, uint256 pods);

    // Field stores a Farmer's Plots and Pod allowances.
    struct Field {
        mapping(uint256 => uint256) plots; // A Farmer's Plots. Maps from Plot index to Pod amount.
        mapping(address => uint256) podAllowances; // An allowance mapping for Pods similar to that of the ERC-20 standard. Maps from spender address to allowance amount.
    }

    mapping(address => Field) internal userPods;

    /**
     * Getters
     **/

    function allowancePods(address owner, address spender) public view returns (uint256) {
        return userPods[owner].podAllowances[spender];
    }

    /**
     * Internal
     **/

    function _transferPlot(
        address from,
        address to,
        uint256 index,
        uint256 start,
        uint256 amount
    ) internal {
        require(from != to, "Field: Cannot transfer Pods to oneself.");
        insertPlot(to, index + start, amount);
        removePlot(from, index, start, amount + start);
        emit PlotTransfer(from, to, index + start, amount);
    }

    function insertPlot(address account, uint256 id, uint256 amount) internal {
        userPods[account].plots[id] = amount;
    }

    function removePlot(address account, uint256 id, uint256 start, uint256 end) internal {
        uint256 amount = userPods[account].plots[id];
        if (start == 0) delete userPods[account].plots[id];
        else userPods[account].plots[id] = start;
        if (end != amount) userPods[account].plots[id + end] = amount + end;
    }

    function decrementAllowancePods(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowancePods(owner, spender);
        setAllowancePods(owner, spender, currentAllowance - amount);
    }

    function setAllowancePods(address owner, address spender, uint256 amount) internal {
        userPods[owner].podAllowances[spender] = amount;
    }
}
