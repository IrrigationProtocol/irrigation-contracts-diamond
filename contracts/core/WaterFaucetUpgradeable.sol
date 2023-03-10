// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./WaterCommonStorage.sol";
import "../utils/EIP2535Initializable.sol";
import "../utils/IrrigationAccessControl.sol";
import "./WaterFaucetStorage.sol";
import "../tokens/WaterUpgradeable.sol";

// Leaky Faucet
contract WaterFaucetUpgradeable is EIP2535Initializable, IrrigationAccessControl {
    using WaterFaucetStorage for WaterFaucetStorage.Layout;
    using WaterCommonStorage for WaterCommonStorage.Layout;
    using SafeERC20Upgradeable for WaterUpgradeable;

    event EpochStarted(uint256 indexed epoch, uint256 amountPerUser, uint256 totalAmount);

    event EpochClaimed(uint256 indexed epoch, address indexed user, uint256 amount);

    uint256 public constant STALK_MIN_AMOUNT = 1e18;
    uint256 public constant PODS_MIN_AMOUNT = 1e18;

    function startEpoch(uint256 amountPerUser, uint256 totalAmount) external onlySuperAdminRole {
        require(totalAmount != 0 && amountPerUser != 0, "zero amount");
        require(totalAmount % amountPerUser == 0, "invalid amount");
        uint256 epoch = WaterFaucetStorage.layout().epochs.length;

        WaterFaucetStorage.layout().epochs.push(
            WaterFaucetStorage.Epoch({
                amountPerUser: amountPerUser,
                totalAmount: totalAmount,
                claimedAmount: 0
            })
        );

        WaterUpgradeable(address(this)).safeTransferFrom(msg.sender, address(this), totalAmount);
        emit EpochStarted(epoch, amountPerUser, totalAmount);
    }

    function claim(uint256 epoch, uint256 fertTokenId) external {
        require(!WaterFaucetStorage.layout().claimed[msg.sender][epoch], "already claimed");

        // we may be able to get this information directly from the beanstalk proxy contract
        require(
            WaterCommonStorage.layout().beanstalk.balanceOfStalk(msg.sender) >= STALK_MIN_AMOUNT ||
                WaterCommonStorage.layout().fertilizer.balanceOf(msg.sender, fertTokenId) != 0,
            "no holdings to claim"
        );

        WaterFaucetStorage.Epoch storage epochData = WaterFaucetStorage.layout().epochs[epoch];
        require(epochData.totalAmount > epochData.claimedAmount, "out of water to claim");

        WaterFaucetStorage.layout().claimed[msg.sender][epoch] = true;
        uint256 amount = epochData.amountPerUser;
        epochData.claimedAmount += amount;

        WaterUpgradeable(address(this)).safeTransfer(msg.sender, amount);

        emit EpochClaimed(epoch, msg.sender, amount);
    }

    // generated getter for epochs
    function epochs(uint256 arg0) public view returns (WaterFaucetStorage.Epoch memory) {
        return WaterFaucetStorage.layout().epochs[arg0];
    }

    // generated getter for claimed
    function claimed(address arg0, uint256 arg1) public view returns (bool) {
        return WaterFaucetStorage.layout().claimed[arg0][arg1];
    }
}
