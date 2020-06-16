// @flow
import * as connext from '@connext/client';
import {getAsyncStore} from '@connext/store';

export async function connectChannel(signer: string) {
  const store = getAsyncStore();
  const network = 'rinkeby';
  return connext.connect(network, {signer, store});
}
