import { debug } from 'debug';
import * as chai from 'chai';

export const assert: Chai.AssertStatic = chai.assert;
export const expect: Chai.ExpectStatic = chai.expect;
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

declare global {
  export var debuglog: debug.Debugger;
}

global.debuglog = debug('IrrigationUnitTest:log');
global.debuglog.color = '158';

export const debuglog = global.debuglog;