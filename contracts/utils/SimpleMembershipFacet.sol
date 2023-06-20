// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";

enum MODULETYPE {
    SPRINKLER,
    AUCTION,
    COMBINE,
    FARMERS_MARKET
}

struct MembershipData {
    mapping(uint256 => FeeAndLimit) feesAndLimits;
    uint256 goodUntil;
}

struct FeeAndLimit {
    uint256 percentage;
    uint256 numTransactionLimits;
    uint256 timeFrame;
}

contract SimpleMembershipFacet {

    mapping(MODULETYPE => uint256) public membershipTypes;
    mapping(address => mapping(MODULETYPE => MembershipData)) public memberData;

    function createMembershipNFT(MODULETYPE _type, string calldata _name, string calldata _url) external {
        LibDiamond.enforceIsContractOwner();
        // assuming CreateNFT is a function in your contract that creates a new NFT and returns its ID
        membershipTypes[_type] = CreateNFT("water", _name, _url);
    }

    function addMembership(address _wallet, MODULETYPE _type, MembershipData calldata _membershipdata) external {
        LibDiamond.enforceIsContractOwner();
        memberData[_wallet][_type] = _membershipdata;
    }

    function editMembership(address _wallet, MODULETYPE _type, MembershipData calldata _membershipdata) external {
        LibDiamond.enforceIsContractOwner();
        require(_membershipdata.goodUntil > block.timestamp, "Membership must be valid");
        memberData[_wallet][_type] = _membershipdata;
    }

    function getMembershipData(address _wallet, MODULETYPE _type) external view returns(MembershipData memory) {
        return memberData[_wallet][_type];
    }

    // Add your ERC1155 hook here
}
