// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
export type Connector = {};

export type ClientMeta = {|
  description: string,
  url: string,
  icons?: string[],
  name: string,
|};

export type Session = {|
  connected: boolean,
  accounts: string[],
  chainId: number,
  bridge: string,
  key: string,
  clientId: string,
  clientMeta?: ClientMeta,
  peerId: string,
  peerMeta?: ClientMeta,
  handshakeId: number,
  handshakeTopic: string,
|};

export type CallRequest = {|
  peerId: string,
  callId: number,
  method: string,
  icon: string,
  name: string,
  url: string,
  params: any[],
|};

export type SessionStatus = {|
  chainId: number,
  accounts: string[],
  networkId?: number,
  rpcUrl?: string,
|};

export type SessionError = {|
  message?: string,
|};

export type CallTxData = {|
  to?: string,
  value?: number | string,
  gas?: number | string,
  gasLimit?: number | string,
  gasPrice?: number | string,
  nonce?: number | string,
  data?: string,
|};

export type ITxData = {|
  ...CallTxData,
  from: string,
|};

export type JsonRpcResponseSuccess = {|
  id: number,
  jsonrpc: string,
  result: any,
|};

export type JsonRpcErrorMessage = {|
  code?: number,
  message: string,
|};

export type JsonRpcRequest = {|
  id: number,
  jsonrpc: string,
  method: string,
  params: any[],
|};

export type JsonRpcResponseError = {|
  id: number,
  jsonrpc: string,
  error: JsonRpcErrorMessage,
|};

type Callback = (e: any, payload: any) => any;
