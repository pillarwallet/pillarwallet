// @flow
export type JsonRpcRequest = {
  id: number,
  jsonrpc: '2.0',
  method: string,
  params: any[],
};

export type JsonRpcResponseSuccess = {
  id: number,
  jsonrpc: '2.0',
  result: any,
};

export type JsonRpcErrorMessage = {
  code?: number,
  message: string,
};

export type JsonRpcResponseError = {
  id: number,
  jsonrpc: '2.0',
  error: JsonRpcErrorMessage,
};
