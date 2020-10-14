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

export type Option = {
  name: string,
  value: string,
  token?: string,
  symbol?: string,
  tokenId?: string,
  imageUrl?: string,
  lastUpdateTime?: string,
  imageSource?: string,
  ethAddress?: string,
  opacity?: number,
  hasSmartWallet?: number,
  disabled?: boolean,
  key?: string,
  value?: string,
  imageUrl?: string,
  icon?: string,
  iconUrl?: string,
  symbol?: string,
  assetBalance?: string,
  formattedBalanceInFiat?: string,
  id?: string,
  decimals?: number,
  tokenType?: string,
  contractAddress?: string,
  address?: string,
  balance?: {
    syntheticBalance?: string,
  },
};

export type HorizontalOption = {
  title?: string,
  data: Option[],
};

export type OptionTabs = {
  name: string,
  id: string,
  options?: Option[],
  collectibles?: boolean,
}
