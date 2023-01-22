// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@gnus.ai/contracts-upgradeable-diamond/contracts/access/OwnableUpgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/IERC20Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC1155/IERC1155Upgradeable.sol";
import "@gnus.ai/contracts-upgradeable-diamond/contracts/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { WaterFaucetStorage } from "./WaterFaucetStorage.sol";
import "../utils/EIP2535Initializable.sol";

contract WaterFaucetUpgradeable is EIP2535Initializable, OwnableUpgradeable {
    using WaterFaucetStorage for WaterFaucetStorage.Layout;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event EpochStarted(
        uint256 indexed epoch,
        uint256 amountPerUser,
        uint256 totalAmount
    );
    event Claimed(uint256 indexed epoch, address indexed user);

    struct Epoch {
        uint256 amountPerUser;
        uint256 totalAmount;
        uint256 claimedAmount;
    }

    uint256 public constant STALK_MIN_AMOUNT = 1e18;
    uint256 public constant PODS_MIN_AMOUNT = 1e18;

    function __WaterFaucet_init(
        address _stalk,
        address _pods,
        address _fert
    ) internal onlyInitializing {
        __Ownable_init_unchained();
        __WaterFaucet_init_unchained(_stalk, _pods, _fert);
    }

    function __WaterFaucet_init_unchained(
        address _stalk,
        address _pods,
        address _fert
    ) internal onlyInitializing {
        require(
                _stalk != address(0) &&
                _pods != address(0) &&
                _fert != address(0),
            "zero addr"
        );

        WaterFaucetStorage.layout().stalkToken = IERC20Upgradeable(_stalk);
        WaterFaucetStorage.layout().podsToken = IERC20Upgradeable(_pods);
        WaterFaucetStorage.layout().fertToken = IERC1155Upgradeable(_fert);
    }

    function startEpoch(uint256 amountPerUser, uint256 totalAmount)
        external
        onlyOwner
    {
        require(totalAmount != 0 && amountPerUser != 0, "zero amount");
        require(totalAmount % amountPerUser == 0, "invalid amount");
        uint256 epoch = WaterFaucetStorage.layout().epochs.length;

        WaterFaucetStorage.layout().epochs.push(
            Epoch({
                amountPerUser: amountPerUser,
                totalAmount: totalAmount,
                claimedAmount: 0
            })
        );

        IERC20Upgradeable(address(this)).safeTransferFrom(msg.sender, address(this), totalAmount);
        emit EpochStarted(epoch, amountPerUser, totalAmount);
    }

    function claim(uint256 epoch, uint256 fertTokenId) external {
        require(!WaterFaucetStorage.layout().claimed[msg.sender][epoch], "already claimed");

        require(
            WaterFaucetStorage.layout().stalkToken.balanceOf(msg.sender) >= STALK_MIN_AMOUNT ||
                WaterFaucetStorage.layout().podsToken.balanceOf(msg.sender) >= PODS_MIN_AMOUNT ||
                WaterFaucetStorage.layout().fertToken.balanceOf(msg.sender, fertTokenId) != 0,
            "nothing hold"
        );

        Epoch storage epochData = WaterFaucetStorage.layout().epochs[epoch];
        require(
            epochData.totalAmount > epochData.claimedAmount,
            "out of water"
        );

        WaterFaucetStorage.layout().claimed[msg.sender][epoch] = true;
        uint256 amount = epochData.amountPerUser;
        epochData.claimedAmount += amount;

        IERC20Upgradeable(address(this)).safeTransfer(msg.sender, amount);

        emit Claimed(epoch, msg.sender);
    }

    // generated getter for stalkToken
    function stalkToken() public view returns(IERC20Upgradeable) {
        return WaterFaucetStorage.layout().stalkToken;
    }

    // generated getter for podsToken
    function podsToken() public view returns(IERC20Upgradeable) {
        return WaterFaucetStorage.layout().podsToken;
    }

    // generated getter for fertToken
    function fertToken() public view returns(IERC1155Upgradeable) {
        return WaterFaucetStorage.layout().fertToken;
    }

    // generated getter for epochs
    function epochs(uint256 arg0) public view returns(Epoch memory) {
        return WaterFaucetStorage.layout().epochs[arg0];
    }

    // generated getter for claimed
    function claimed(address arg0,uint256 arg1) public view returns(bool) {
        return WaterFaucetStorage.layout().claimed[arg0][arg1];
    }

}
