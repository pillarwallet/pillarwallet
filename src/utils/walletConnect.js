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
import { BigNumber as EthersBigNumber, Interface, utils } from 'ethers';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// constants
import { ETH } from 'constants/assetsConstants';
import { TOKEN_TRANSFER } from 'constants/functionSignaturesConstants';
import {
  ETH_SEND_TX,
  ETH_SIGN,
  ETH_SIGN_TX,
  ETH_SIGN_TYPED_DATA,
  PERSONAL_SIGN,
  REQUEST_TYPE,
} from 'constants/walletConnectConstants';

// utils
import { addressesEqual, getAssetData, getAssetDataByAddress } from 'utils/assets';

// abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { WalletConnectCallRequest, WalletConnectSession } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';
import type { Asset } from 'models/Asset';


// urls of dapps that don't support smart accounts
// or that we don't want to support for any reason
// TODO: still unsupported?
const UNSUPPORTED_APPS_URLS: string[] = [
  'https://app.mooni.tech',
  'https://localcryptos.com',
  'https://www.binance.org',
];

export const hasKeyBasedWalletConnectSession = (
  sessions: WalletConnectSession[],
  keyWalletAddress: string,
): boolean => {
  if (!sessions[0]?.accounts) return false;
  return sessions[0].accounts.some((address) => addressesEqual(address, keyWalletAddress));
};

export const isSupportedDappUrl = (url: string): boolean => !UNSUPPORTED_APPS_URLS.includes(url);

const isTokenTransfer = (data) => typeof data === 'string'
  && data.toLowerCase() !== '0x'
  && data.toLowerCase().startsWith(TOKEN_TRANSFER);

export const parseMessageSignParamsFromCallRequest = (callRequest: WalletConnectCallRequest): {
  address: string,
  message: string,
  displayMessage: string,
} => {
  const { method, params } = callRequest;

  let callRequestParams = [...params];
  if (method === PERSONAL_SIGN) {
    // different param order on PERSONAL_SIGN
    callRequestParams = callRequestParams.reverse();
  }

  const [address, message] = callRequestParams;

  let displayMessage;
  if (method === PERSONAL_SIGN) {
    try {
      displayMessage = utils.toUtf8String(callRequestParams[1]);
    } catch (e) {
      ([, displayMessage] = callRequestParams);
    }
  } else if (method === ETH_SIGN_TYPED_DATA) {
    displayMessage = t('transactions.paragraph.typedDataMessage');
  } else {
    ([, displayMessage] = callRequestParams);
  }

  return { address, message, displayMessage };
};

export const mapCallRequestToTransactionPayload = (
  callRequest: WalletConnectCallRequest,
  accountAssets: Asset[],
  supportedAssets: Asset[],
): $Shape<TransactionPayload> => {
  const [{ value = 0, data }] = callRequest.params;
  let [{ to }] = callRequest.params;

  // to address can be either token contract (transfer data) or other kind of contract
  const assetData = isTokenTransfer(data) && to
    ? getAssetDataByAddress(accountAssets, supportedAssets, to)
    : {};

  let amount;
  if (isEmpty(assetData)) {
    amount = utils.formatEther(EthersBigNumber.from(value).toString());
  } else {
    const erc20Interface = new Interface(ERC20_CONTRACT_ABI);
    const parsedTransaction = erc20Interface.parseTransaction({ data, value }) || {};
    const {
      args: [
        methodToAddress,
        methodValue = 0,
      ],
    } = parsedTransaction; // get method value and address input

    // do not parse amount as number, last decimal numbers might change after converting
    amount = utils.formatUnits(methodValue, assetData.decimals);
    to = methodToAddress;
  }

  const ethAssetData = getAssetData(accountAssets, supportedAssets, ETH);

  const {
    symbol = ETH,
    address: contractAddress = ethAssetData.address,
    decimals = 18,
  } = assetData;

  return {
    to,
    amount,
    data,
    symbol,
    contractAddress,
    decimals,
  };
};

export const getWalletConnectCallRequestType = (callRequest: WalletConnectCallRequest): string => {
  switch (callRequest?.method) {
    case ETH_SEND_TX:
    case ETH_SIGN_TX:
      return REQUEST_TYPE.TRANSACTION;
    case ETH_SIGN:
    case ETH_SIGN_TYPED_DATA:
    case PERSONAL_SIGN:
      return REQUEST_TYPE.MESSAGE;
    default:
      return REQUEST_TYPE.UNSUPPORTED;
  }
};
