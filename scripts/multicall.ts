export const makeAggregateCalldata = (callObjectArray: { [key: string]: any }) => {
  try {
    const calldata = callObjectArray?.map((item: any) => {
      return {
        target: item?.contract?.address,
        callData: item?.contract?.interface?.encodeFunctionData(item?.functionName, item?.param),
      };
    });
    return calldata;
  } catch (error: any) {
    console.log('makeAggregateCalldata', error?.message);
    return [];
  }
};

const parseAggregateCalldata = (
  returnResult: any,
  callObjectArray: MulticallObject[]
): any => {
  try {
    const returnData: any = {};
    callObjectArray.forEach((item: any, idx: number) => {
      const returnKey = item.returnKey || item.functionName;
      if (!returnResult[idx].success) {
        console.error("multicallParse error", returnKey);
        return;
      }
      if (returnKey) {
        let decodedResult = item.contract.interface.decodeFunctionResult(
          item.functionName,
          returnResult[idx].returnData
        );        
        returnData[returnKey] = decodedResult;
      }
    });
    return returnData;
  } catch (error: any) {
    console.log("parseAggregateCalldata", error?.message);
    throw error;
  }
};

export interface MulticallObject {
  contract: any;
  functionName: string;
  params: Array<any>;
  returnKey?: string;
}

export async function multicallRead(
  multicallContract: any,
  callObjectArray: MulticallObject[]
): Promise<any> {
  try {
    let returnData = {};
    const fetchUnit = 1400;
    for (let i = 0; i < callObjectArray.length; i += fetchUnit) {
      const tempCallDataArray = callObjectArray.filter((item, idx) => {
        return idx >= i && idx < i + fetchUnit;
      });
      const calldata = makeAggregateCalldata(tempCallDataArray);
      const result = await multicallContract.tryAggregate(false, calldata);
      const tempReturnData = parseAggregateCalldata(result, tempCallDataArray);
      returnData = { ...returnData, ...tempReturnData };
    }
    return returnData;
  } catch (e: any) {
    console.log("multicallRead", [e.message]);
  }
}
