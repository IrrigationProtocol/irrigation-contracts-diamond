// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Faucet is Ownable {
    using SafeERC20 for IERC20;

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

    IERC20 public immutable waterToken;
    IERC20 public immutable stalkToken;
    IERC20 public immutable podsToken;
    IERC1155 public immutable fertToken;

    Epoch[] public epochs;

    mapping(address => mapping(uint256 => bool)) public claimed;

    constructor(
        address _water,
        address _stalk,
        address _pods,
        address _fert
    ) {
        require(
            _water != address(0) &&
                _stalk != address(0) &&
                _pods != address(0) &&
                _fert != address(0),
            "zero addr"
        );

        waterToken = IERC20(_water);
        stalkToken = IERC20(_stalk);
        podsToken = IERC20(_pods);
        fertToken = IERC1155(_fert);
    }

    function startEpoch(uint256 amountPerUser, uint256 totalAmount)
        external
        onlyOwner
    {
        require(totalAmount != 0 && amountPerUser != 0, "zero amount");
        require(totalAmount % amountPerUser == 0, "invalid amount");
        uint256 epoch = epochs.length;

        epochs.push(
            Epoch({
                amountPerUser: amountPerUser,
                totalAmount: totalAmount,
                claimedAmount: 0
            })
        );

        waterToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        emit EpochStarted(epoch, amountPerUser, totalAmount);
    }

    function claim(uint256 epoch, uint256 fertTokenId) external {
        require(!claimed[msg.sender][epoch], "already claimed");

        require(
            stalkToken.balanceOf(msg.sender) >= STALK_MIN_AMOUNT ||
                podsToken.balanceOf(msg.sender) >= PODS_MIN_AMOUNT ||
                fertToken.balanceOf(msg.sender, fertTokenId) != 0,
            "nothing hold"
        );

        Epoch storage epochData = epochs[epoch];
        require(
            epochData.totalAmount > epochData.claimedAmount,
            "out of water"
        );

        claimed[msg.sender][epoch] = true;
        uint256 amount = epochData.amountPerUser;
        epochData.claimedAmount += amount;

        waterToken.safeTransfer(msg.sender, amount);

        emit Claimed(epoch, msg.sender);
    }
}
