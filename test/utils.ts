import { expect } from 'chai';
import { ethers } from 'hardhat';
import { utils, constants, BigNumber, BigNumberish } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export type ClaimInfo = {
  user: SignerWithAddress;
  ranking: number;
  amount: BigNumberish;
};

export const getLeaf = (info: ClaimInfo): Buffer =>
  keccak256(
    utils.defaultAbiCoder.encode(
      ['address', 'uint64', 'uint256'],
      [info.user.address, info.ranking, info.amount],
    ),
  );

export const getAirdropMerkleTree = (claimInfos: ClaimInfo[]): MerkleTree => {
  const leafNodes = claimInfos.map((info) => getLeaf(info));

  const merkleTree = new MerkleTree(leafNodes, keccak256, {
    sortPairs: true,
  });

  return merkleTree;
};

export const getCurrentTime = async (): Promise<BigNumber> =>
  BigNumber.from(
    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
  );

export const getCurrentBlock = async (): Promise<BigNumber> =>
  BigNumber.from((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).number);

export const advanceBlocks = async (blocks: number): Promise<void> => {
  for (let i = 0; i < blocks; i++) {
    await ethers.provider.send('evm_mine', []);
  }
};

export const increaseTime = async (seconds: BigNumberish): Promise<void> => {
  await ethers.provider.send('evm_increaseTime', [seconds]);
  await ethers.provider.send('evm_mine', []);
};

export const delaySecond = async (second: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, second * 1000);
  });

// the func is used, when expected value is slightly smaller than real value due to overflow operation
export const expectWithError = (expectedValue, realValue) => {
  expect(expectedValue).lte(realValue);
  // available error is 0.1%
  expect(expectedValue).gt(realValue.mul(999).div(1000));
}