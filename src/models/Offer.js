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

import type { TransactionPayload } from 'models/Transaction';

type ExchangeOfferAsset = {
  code: string,
  decimals: string,
  address: string,
}

export type Offer = {
  provider: string,
  _id: string,
  description: string,
  fromAsset: ExchangeOfferAsset,
  toAsset: ExchangeOfferAsset,
  askRate: number | string,
  minQuantity: number,
  maxQuantity: number,
  allowanceSet: boolean,
  trackId: string,
}

export type FiatOffer = {
  provider: string,
  askRate: number | string,
  fromAsset: { code: string },
  toAsset: { code: string },
  feeAmount: number | string,
  extraFeeAmount: number | string,
  quoteCurrencyAmount: number,
  minQuantity: number,
  maxQuantity: number,
  offerRestricted: ?string,
}

export type OfferRequest = {
  quantity: number,
  provider: string,
  fromAssetAddress: string,
  toAssetAddress: string,
  walletId: ?string,
}

export type TokenAllowanceRequest = {
  fromAssetAddress: string,
  toAssetAddress: string,
  provider: string,
  walletId: ?string,
}

export type OfferOrder = {
  _id: string,
  receiveQuantity: string,
  payQuantity: string,
  fromAsset: ExchangeOfferAsset,
  toAsset: ExchangeOfferAsset,
  payToAddress: string,
  transactionObj?: {
    data: string,
  },
  setTokenAllowance?: boolean,
  provider?: string,
  transactionPayload: TransactionPayload,
}

export type ExchangeSearchRequest = {
  fromAssetCode: string,
  toAssetCode: string,
  fromAmount: number,
}

export type Allowance = {
  provider: string,
  fromAssetCode: string,
  toAssetCode: string,
  transactionHash: string,
  enabled?: boolean,
}

export type ExchangeProvider = {
  id: string,
  dateConnected: Date,
  extra?: any,
}

type ProviderMeta = {
  _id: string,
  shim: string,
  name: string,
  url: string,
  description: string,
  icon_small: string,
  icon_medium: string,
  icon_large: string,
  logo_small: string,
  logo_medium: string,
  logo_large: string,
}

export type ProvidersMeta = ProviderMeta[];
