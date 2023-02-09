// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../mock/MockERC20Upgradeable.sol";
import "../utils/Utils.sol";
import "../libraries/ZkVerifier/ZetherVerifier.sol";
import "../libraries/ZkVerifier/BurnVerifier.sol";
import "../libraries/TransferHelper.sol";
import "./ZSCStorage.sol";

contract ZSCUpgradeable {
    using Utils for uint256;
    using Utils for Utils.G1Point;
    using ZSCStorage for ZSCStorage.Layout;

    uint256 private constant MAX = 4294967295; // 2^32 - 1 // no sload for constants...!
    uint256 private constant EPOCHLENGTH = 4;

    event TransferOccurred(Utils.G1Point[] parties, Utils.G1Point beneficiary);

    // arg is still necessary for transfers---not even so much to know when you received a transfer, as to know when you got rolled over.

    constructor() {
        // epoch length, like block.time, is in _seconds_. 4 is the minimum!!! (To allow a withdrawal to go through.)
        ZSCStorage.layout().epochLength = EPOCHLENGTH;
        ZSCStorage.layout().fee = ZetherVerifier.fee;
        Utils.G1Point memory empty;
        ZSCStorage.layout().pending[keccak256(abi.encode(empty))][1] = Utils.g(); // "register" the empty account...
    }

    function simulateAccounts(Utils.G1Point[] memory y, uint256 epoch)
        public
        view
        returns (Utils.G1Point[2][] memory accounts)
    {
        // in this function and others, i have to use public + memory (and hence, a superfluous copy from calldata)
        // only because calldata structs aren't yet supported by solidity. revisit this in the future.
        uint256 size = y.length;
        accounts = new Utils.G1Point[2][](size);
        for (uint256 i = 0; i < size; i++) {
            bytes32 yHash = keccak256(abi.encode(y[i]));
            accounts[i] = ZSCStorage.layout().acc[yHash];
            if (ZSCStorage.layout().lastRollOver[yHash] < epoch) {
                Utils.G1Point[2] memory scratch = ZSCStorage.layout().pending[yHash];
                accounts[i][0] = accounts[i][0].add(scratch[0]);
                accounts[i][1] = accounts[i][1].add(scratch[1]);
            }
        }
    }

    function rollOver(bytes32 yHash) internal {
        uint256 e = block.timestamp / ZSCStorage.layout().epochLength;
        if (ZSCStorage.layout().lastRollOver[yHash] < e) {
            Utils.G1Point[2][2] memory scratch = [
                ZSCStorage.layout().acc[yHash],
                ZSCStorage.layout().pending[yHash]
            ];
            ZSCStorage.layout().acc[yHash][0] = scratch[0][0].add(scratch[1][0]);
            ZSCStorage.layout().acc[yHash][1] = scratch[0][1].add(scratch[1][1]);
            // ZSCStorage.layout().acc[yHash] = scratch[0]; // can't do this---have to do the above instead (and spend 2 sloads / stores)---because "not supported". revisit
            delete ZSCStorage.layout().pending[yHash]; // pending[yHash] = [Utils.G1Point(0, 0), Utils.G1Point(0, 0)];
            ZSCStorage.layout().lastRollOver[yHash] = e;
        }
        if (ZSCStorage.layout().lastGlobalUpdate < e) {
            ZSCStorage.layout().lastGlobalUpdate = e;
            delete ZSCStorage.layout().nonceSet;
        }
    }

    function registered(bytes32 yHash) internal view returns (bool) {
        Utils.G1Point memory zero = Utils.G1Point(0, 0);
        Utils.G1Point[2][2] memory scratch = [
            ZSCStorage.layout().acc[yHash],
            ZSCStorage.layout().pending[yHash]
        ];
        return
            !(scratch[0][0].eq(zero) &&
                scratch[0][1].eq(zero) &&
                scratch[1][0].eq(zero) &&
                scratch[1][1].eq(zero));
    }

    function register(
        Utils.G1Point memory y,
        uint256 c,
        uint256 s
    ) public {
        // allows y to participate. c, s should be a Schnorr signature on "this"
        Utils.G1Point memory K = Utils.g().mul(s).add(y.mul(c.neg()));
        uint256 challenge = uint256(keccak256(abi.encode(address(this), y, K))).mod();
        require(challenge == c, "Invalid registration signature!");
        bytes32 yHash = keccak256(abi.encode(y));
        require(!registered(yHash), "Account already registered!");
        ZSCStorage.layout().pending[yHash][0] = y;
        ZSCStorage.layout().pending[yHash][1] = Utils.g();
    }

    function fund(Utils.G1Point memory y, uint32 bTransfer) public {
        bytes32 yHash = keccak256(abi.encode(y));
        require(registered(yHash), "Account not yet registered.");
        rollOver(yHash);
        uint256 amount = uint256(bTransfer);
        Utils.G1Point memory scratch = ZSCStorage.layout().pending[yHash][0];
        scratch = scratch.add(Utils.g().mul(amount));
        ZSCStorage.layout().pending[yHash][0] = scratch;
        TransferHelper.safeTransferFrom(
            ZSCStorage.layout().tokenAddress,
            msg.sender,
            address(this),
            amount
        );
        // require(coin.balanceOf(address(this)) <= MAX, "Fund pushes contract past maximum value.");
    }

    function transferFunds(
        Utils.G1Point[] memory C,
        Utils.G1Point memory D,
        Utils.G1Point[] memory y,
        Utils.G1Point memory u,
        bytes memory proof,
        Utils.G1Point memory beneficiary
    ) public {
        uint256 size = y.length;
        Utils.G1Point[] memory CLn = new Utils.G1Point[](size);
        Utils.G1Point[] memory CRn = new Utils.G1Point[](size);
        require(C.length == size, "Input array length mismatch!");

        bytes32 beneficiaryHash = keccak256(abi.encode(beneficiary));
        require(registered(beneficiaryHash), "Miner's account is not yet registered."); // necessary so that receiving a fee can't "backdoor" you into registration.
        rollOver(beneficiaryHash);
        Utils.G1Point memory beneficiaryPending = ZSCStorage.layout().pending[beneficiaryHash][0];
        ZSCStorage.layout().pending[beneficiaryHash][0] = beneficiaryPending.add(
            Utils.g().mul(ZSCStorage.layout().fee)
        );

        for (uint256 i = 0; i < size; i++) {
            bytes32 yHash = keccak256(abi.encode(y[i]));
            require(registered(yHash), "Account not yet registered.");
            rollOver(yHash);
            Utils.G1Point[2] memory scratch = ZSCStorage.layout().pending[yHash];
            ZSCStorage.layout().pending[yHash][0] = scratch[0].add(C[i]);
            ZSCStorage.layout().pending[yHash][1] = scratch[1].add(D);

            scratch = ZSCStorage.layout().acc[yHash]; // trying to save an sload, i guess.
            CLn[i] = scratch[0].add(C[i]);
            CRn[i] = scratch[1].add(D);
        }

        bytes32 uHash = keccak256(abi.encode(u));
        for (uint256 i = 0; i < ZSCStorage.layout().nonceSet.length; i++) {
            require(ZSCStorage.layout().nonceSet[i] != uHash, "Nonce already seen!");
        }
        ZSCStorage.layout().nonceSet.push(uHash);
        {
            Utils.G1Point memory localU = u;
            Utils.G1Point memory localD = D;
            Utils.G1Point[] memory localC = C;
            Utils.G1Point[] memory localY = y;
            bytes memory localProof = proof;
            require(
                ZetherVerifier.verifyTransfer(
                    CLn,
                    CRn,
                    localC,
                    localD,
                    localY,
                    ZSCStorage.layout().lastGlobalUpdate,
                    localU,
                    localProof
                ),
                "Transfer proof verification failed!"
            );
        }

        emit TransferOccurred(y, beneficiary);
    }

    function withdrawFunds(
        Utils.G1Point memory y,
        uint256 bTransfer,
        Utils.G1Point memory u,
        bytes memory proof
    ) public {
        bytes32 yHash = keccak256(abi.encode(y));
        require(registered(yHash), "Account not yet registered.");
        rollOver(yHash);

        require(0 <= bTransfer && bTransfer <= MAX, "Transfer amount out of range.");
        Utils.G1Point[2] memory scratch = ZSCStorage.layout().pending[yHash];
        ZSCStorage.layout().pending[yHash][0] = scratch[0].add(Utils.g().mul(bTransfer.neg()));

        scratch = ZSCStorage.layout().acc[yHash]; // simulate debit of acc---just for use in verification, won't be applied
        scratch[0] = scratch[0].add(Utils.g().mul(bTransfer.neg()));
        bytes32 uHash = keccak256(abi.encode(u));
        for (uint256 i = 0; i < ZSCStorage.layout().nonceSet.length; i++) {
            require(ZSCStorage.layout().nonceSet[i] != uHash, "Nonce already seen!");
        }
        ZSCStorage.layout().nonceSet.push(uHash);

        require(
            BurnVerifier.verifyBurn(
                scratch[0],
                scratch[1],
                y,
                ZSCStorage.layout().lastGlobalUpdate,
                u,
                msg.sender,
                proof
            ),
            "Burn proof verification failed!"
        );
        TransferHelper.safeTransfer(ZSCStorage.layout().tokenAddress, msg.sender, bTransfer);
    }
}
