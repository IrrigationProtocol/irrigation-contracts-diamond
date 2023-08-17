import { BigNumber } from "ethers";

export interface AuctionData {
    seller: string;
    startTime: number;
    endTime: number;
    sellToken: string;
    trancheIndex: BigNumber,
    sellAmount: BigNumber;
    minBidAmount: BigNumber;
    //
    fixedPrice: BigNumber;
    priceRangeStart: BigNumber;
    //
    priceRangeEnd: BigNumber;
    reserve: BigNumber;
    //
    curBidId: number;
    incrementBidPrice: BigNumber;
    //    
    // sum of bidAmounts of bidders
    totalBidAmount: BigNumber;
    bidTokenGroupId: number;
    // bids in [id = curBidId + 1 - availableBidDepth, curBidId] are winners
    availableBidDepth: number;
    status: number;
    auctionType: number;    
}

export interface AuctionSetting {
    startTime: number;
    sellToken: string;
    //
    trancheIndex: BigNumber,
    //    
    minBidAmount: BigNumber;
    fixedPrice: BigNumber;
    //
    priceRangeStart: BigNumber;
    priceRangeEnd: BigNumber;
    //
    sellAmount: BigNumber;
    reserve: BigNumber;
    //    
    incrementBidPrice: BigNumber;
    endTime: number;
    bidTokenGroupId: number;
    auctionType: number;
    periodId: number;
}

export interface Bid {
    bidAmount: BigNumber;
    bidPrice: BigNumber;
    //
    bidder: string,
    //
    paidAmount: BigNumber;
    bidTokenId: number;
    //
    status: number;
}