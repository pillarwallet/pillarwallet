// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { BigNumber } from 'utils/common';
import { formatFiatValue, formatFiatProfit } from 'utils/format';
import { useThemeColors } from 'utils/themes';

// Types
import type { WalletInfo, ChainInfo, BalanceInfo } from 'models/Home';
import type { IconName } from 'components/Icon';

// Local
import HomeListHeader from './components/HomeListHeader';
import HomeListItem from './components/HomeListItem';

const mainnetIcon = require('assets/icons/icon-24-network-mainnet.png');
const binanceIcon = require('assets/icons/icon-24-network-binance.png');
const xdaiIcon = require('assets/icons/icon-24-network-xdai.png');

type Props = {|
  showSideChains: boolean,
|};

function AssetsSection({ showSideChains }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.assets');
  const wallet = useWalletInfo();

  const fiatCurrency = useFiatCurrency();

  const colors = useThemeColors();

  const renderBalanceItem = (title: string, iconName: IconName, balance: ?BalanceInfo) => {
    if (!balance) return null;

    const formattedBalance = formatFiatValue(balance?.balanceInFiat ?? 0, fiatCurrency);
    const formattedProfit = formatFiatProfit(balance.profitInFiat, balance.balanceInFiat, fiatCurrency);

    return (
      <HomeListItem
        title={title}
        iconName={iconName}
        value={formattedBalance}
        secondaryValue={formattedProfit}
        secondaryValueColor={balance.profitInFiat?.gte(0) ? colors.positive : colors.secondaryText}
      />
    );
  };

  const renderChainInfo = (chainInfo: ?ChainInfo) => {
    if (!chainInfo) return null;

    const formattedCollectibles = chainInfo.collectibles?.toFixed() ?? '0';
    const formattedContacts = chainInfo.contacts?.toFixed() ?? '0';

    return (
      <>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {renderBalanceItem(t('wallet'), 'wallet', chainInfo.wallet)}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {renderBalanceItem(t('deposits'), 'wallet', chainInfo.deposits)}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {renderBalanceItem(t('investments'), 'wallet', chainInfo.investments)}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {renderBalanceItem(t('pools'), 'wallet', chainInfo.pools)}

        {chainInfo.collectibles != null && (
          <HomeListItem title={t('collectibles')} iconName="wallet" value={formattedCollectibles} />
        )}
        {chainInfo.contacts != null && (
          <HomeListItem title={t('contacts')} iconName="wallet" value={formattedContacts} />
        )}
      </>
    );
  };

  if (!showSideChains) {
    return <Container>{renderChainInfo(wallet.mainnet)}</Container>;
  }

  return (
    <Container>
      <HomeListHeader title={tRoot('ethereum')} color={colors.ethereum} iconSource={mainnetIcon} />
      {renderChainInfo(wallet.mainnet)}
      <HomeListHeader title={tRoot('sideChains.binance')} color={colors.binance} iconSource={binanceIcon} />
      {renderChainInfo(wallet.binance)}
      <HomeListHeader title={tRoot('sideChains.xdai')} color={colors.xdai} iconSource={xdaiIcon} />
      {renderChainInfo(wallet.xdai)}
    </Container>
  );
}

export default AssetsSection;

const useWalletInfo = (): WalletInfo => {
  // TODO: replace with proper implentation when available
  return {
    mainnet: {
      wallet: {
        balanceInFiat: BigNumber(306.4),
        profitInFiat: BigNumber(7.2),
      },
      deposits: {
        balanceInFiat: BigNumber(53120.92),
        profitInFiat: BigNumber(5670.0),
      },
      investments: {
        balanceInFiat: BigNumber(658.81),
        profitInFiat: BigNumber(-23.45),
      },
      collectibles: 0,
      contacts: 5,
    },
    binance: {
      wallet: {
        balanceInFiat: BigNumber(0.04),
        profitInFiat: BigNumber(0.01),
      },
      pools: {
        balanceInFiat: BigNumber(288.6),
        profitInFiat: BigNumber(11.23),
      },
    },
    xdai: {
      wallet: {
        balanceInFiat: BigNumber(0),
        profitInFiat: BigNumber(0),
      },
    },
  };
};


const Container = styled.View``;
