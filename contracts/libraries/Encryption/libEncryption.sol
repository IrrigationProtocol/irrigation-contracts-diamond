// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../utils/Utils.sol";

library libEncryption {

    using Utils for uint256;
    using Utils for Utils.G1Point;

    bytes32 internal constant STORAGE_SLOT = keccak256("irrigation.contracts.storage.EncryptionLib");

    struct EncryptedValue {
        Utils.G1Point c1;
        Utils.G1Point c2;
    }

    struct Layout {
        mapping(bytes32 => EncryptedValue) encryptedAddresses;   // the encrypted address that have registered
        mapping(uint32 => Utils.G1Point) publicKeys;             // the public keys to encrypt with
        uint32 numberPublicKeys;                                 // the number of public keys to use,
    }


    function isEncyptedValueNull(EncryptedValue storage encVal) internal view returns (bool) {
        return ((encVal.c1.x == 0) && (encVal.c1.y == 0) && (encVal.c2.x == 0) && (encVal.c1.y == 0));
    }

    function encrypt(Utils.G1Point memory pKey, uint256 plainValue, uint256 additionalSeed) public view returns (Utils.G1Point memory c1, Utils.G1Point memory c2) {
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), additionalSeed)));
        Utils.G1Point memory r = Utils.mapInto(plainValue);
        uint256 k = Utils.fieldExp(seed, 2);
        c1 = Utils.g().mul(k);
        Utils.G1Point memory s = pKey.mul(k);
        c2 = Utils.add(s, r);
    }

    function decrypt(uint256 privateKey, Utils.G1Point memory c1, Utils.G1Point memory c2) public view returns (uint256 plainValue) {
        Utils.G1Point memory r = c1.mul(privateKey);
        Utils.G1Point memory negR = Utils.neg(r);
        Utils.G1Point memory result = Utils.add(c2, negR);
        plainValue = uint256(result.x);
    }

    function decryptWithSavedData(uint256 privateKey, bytes32 yHash) public view returns (uint256 plainValue) {
        EncryptedValue memory encryptedValue = layout().encryptedAddresses[yHash];
        uint256 encrypted = decrypt(privateKey, encryptedValue.c1, encryptedValue.c2);
        return encrypted;
    }

    function isPowerOf2(uint32 x) internal pure returns (bool) {
        return (x != 0) && ((x & (x - 1)) == 0);
    }

    function encryptAndSaveAddress(bytes32 yHash, address caller, uint256 additionalSeed) public {
        uint256 cValue = uint256(uint160(caller));
        uint32 publicKeyIndex = uint32(cValue & uint256(layout().numberPublicKeys-1));
        require(!Utils.isNull(layout().publicKeys[publicKeyIndex]), "Public key not set for that index");
        Utils.G1Point memory publicKey = layout().publicKeys[publicKeyIndex];
        (Utils.G1Point memory c1, Utils.G1Point memory c2) = encrypt(publicKey, cValue, additionalSeed );
        layout().encryptedAddresses[yHash] = EncryptedValue(c1, c2);
    }

    function init() public {
        setMaxKeys(1);
    }

    function setMaxKeys(uint32 maxPublicKeys) public {
        require(isPowerOf2(maxPublicKeys), "Max Number of Public Keys need to be a power of 2");
        layout().numberPublicKeys = maxPublicKeys;
    }

    function setPublicKeys(uint32 numKeys, uint32 offset, Utils.G1Point[] memory publicKeysIn) public {
        require((numKeys + offset <= layout().numberPublicKeys) && (offset + publicKeysIn.length <= layout().numberPublicKeys)
        , "Too Many public keys sent");
        for (uint32 i = offset; i < publicKeysIn.length; i++) {
            layout().publicKeys[i] = publicKeysIn[i];
        }
    }

    function layout() internal pure returns (Layout storage ls) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}
