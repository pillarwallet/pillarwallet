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

import * as React from 'react';
import { FlatList, Image } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { createStructuredSelector } from 'reselect';
import { withTheme } from 'styled-components/native';

import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { EXCHANGE, POOLTOGETHER_DASHBOARD } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';
import type { ProvidersMeta } from 'models/Offer';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import { spacing } from 'utils/variables';
import { getMetaDataAction } from 'actions/exchangeActions';

import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';

type Props = {
  theme: Theme,
  providersMeta: ProvidersMeta,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  getMetaData: () => void,
  isSmartWalletActive: boolean,
};

const visaIcon = require('assets/icons/visa.png');
const mastercardIcon = require('assets/icons/mastercard.png');

class ServicesScreen extends React.Component<Props> {
  componentDidMount() {
    const { getMetaData, providersMeta } = this.props;
    if (!Array.isArray(providersMeta) || !providersMeta?.length) {
      getMetaData();
    }
  }

  getServices = () => {
    const {
      navigation, theme, baseFiatCurrency, providersMeta, isSmartWalletActive,
    } = this.props;
    const colors = getThemeColors(theme);

    const offersBadge = Array.isArray(providersMeta) && !!providersMeta.length ? {
      label: `${providersMeta.length} exchanges`,
      color: colors.primary,
    } : null;

    return [
      {
        key: 'offersEngine',
        title: 'Offers engine',
        body: 'Aggregated offers from many decentralized exchanges and token swap services',
        action: () => navigation.navigate(EXCHANGE),
        labelBadge: offersBadge,
      },
      {
        key: 'buyCryptoWithFiat',
        // hack to avoid inline images because of iOS13 issue. Likely can be dropped in RN 0.62
        title: [
          'Buy crypto with ',
          <Image source={mastercardIcon} style={{ marginBottom: 1 }} height={11} />,
          ' & ',
          <Image source={visaIcon} height={11} />,
        ],
        body: 'USD, GBP, EUR supported',
        action: () => navigation.navigate(
          EXCHANGE,
          {
            fromAssetCode: baseFiatCurrency || defaultFiatCurrency,
            toAssetCode: ETH,
            displayFiatOptionsFirst: true,
          }),
      },
      {
        key: 'peerToPeerTrading',
        title: 'Peer-to-peer trading',
        body: 'Swap tokens directly with others. Safe, secure, anonymous',
        disabled: true,
        label: 'soon',
      },
      {
        key: 'poolTogether',
        title: 'Pool Together savings game',
        body: 'Deposit DAI/USDC into the pool to get tickets. Each ticket is a chance to win weekly/daily prizes!',
        disabled: !isSmartWalletActive,
        hidden: !isSmartWalletActive,
        action: () => navigation.navigate(POOLTOGETHER_DASHBOARD),
      },
    ];
  };

  renderServicesItem = ({ item }) => {
    const {
      title,
      body,
      action,
      disabled,
      label,
      labelBadge,
      hidden = false,
    } = item;

    if (hidden) {
      return null;
    }
    return (
      <ListCard
        title={title}
        subtitle={body}
        action={action}
        disabled={disabled}
        label={label}
        labelBadge={labelBadge}
      />
    );
  }

  render() {
    const services = this.getServices();
    return (
      <ContainerWithHeader
        headerProps={{
          noBack: true,
          rightItems: [{ link: 'Support', onPress: () => Intercom.displayMessenger() }],
          leftItems: [{ title: 'Services' }],
        }}
        inset={{ bottom: 'never' }}
        tab
      >
        {onScroll => (
          <FlatList
            data={services}
            keyExtractor={(item) => item.key}
            renderItem={this.renderServicesItem}
            contentContainerStyle={{ width: '100%', padding: spacing.layoutSides, paddingBottom: 40 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        )}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  exchange: { providersMeta },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  providersMeta,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  isSmartWalletActive: isActiveAccountSmartWalletSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  getMetaData: () => dispatch(getMetaDataAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ServicesScreen));
