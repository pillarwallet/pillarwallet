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
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { EXCHANGE } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';
import type { Offer } from 'models/Offer';
import { withTheme } from 'styled-components/native';
import type { RootReducerState } from 'reducers/rootReducer';
import { spacing } from 'utils/variables';

type Props = {
  theme: Theme,
  offers: Offer[],
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
};

class ServicesScreen extends React.Component<Props> {
  getServices = () => {
    const {
      navigation, theme, offers, baseFiatCurrency,
    } = this.props;
    const colors = getThemeColors(theme);

    const offersBadge = (offers && offers.length) ? {
      label: `${offers.length} exchanges`,
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
        key: 'peerToPeerTrading',
        title: 'Peer-to-peer trading',
        body: 'Swap tokens directly with others. safe, secure, anonymous',
        disabled: true,
        label: 'soon',
      },
      {
        key: 'buyCryptoWithFiat',
        title: 'Buy crypto with fiat',
        body: 'USD, GBP, EUR supported',
        action: () => navigation.navigate(
          EXCHANGE,
          {
            fromAssetCode: baseFiatCurrency || defaultFiatCurrency,
            toAssetCode: ETH,
          }),
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
    } = item;

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
      >
        <FlatList
          data={services}
          keyExtractor={(item) => item.key}
          renderItem={this.renderServicesItem}
          contentContainerStyle={{ width: '100%', padding: spacing.layoutSides, paddingBottom: 40 }}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  exchange: { data: { offers } },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  offers,
  baseFiatCurrency,
});

export default withTheme(connect(mapStateToProps)(ServicesScreen));
