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
import { Platform } from 'react-native';
import isEqual from 'lodash.isequal';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import ActivityFeed from 'components/ActivityFeed';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { TRANSACTIONS } from 'constants/activityConstants';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';

import Header from 'components/Header';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import { SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object,
  resetHideRemoval: Function,
  collectibles: Object[],
};

const ActionButtonsWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 5px;
  padding-bottom: 30px;
  padding-top: ${Platform.select({
    ios: '10px',
    android: '30px',
  })};
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 64px ${spacing.large}px ${spacing.large}px;
  justify-content: center;
`;

const Description = styled(Paragraph)`
  line-height: ${fontSizes.mediumLarge};
`;

const CircleButtonsWrapper = styled(Wrapper)`
  margin-top: ${Platform.select({
    ios: 0,
    android: '-20px',
  })};
`;

const CollectibleImage = styled(CachedImage)`
  align-self: center;
  height: 180px;
  width: 180px;
  margin-top: 30px;
`;

const iconSend = require('assets/icons/icon_send.png');
const genericCollectible = require('assets/images/no_logo.png');

class CollectibleScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_COLLECTIBLE_FROM_ASSET_FLOW, { assetData });
  };

  render() {
    const { navigation, collectibles } = this.props;
    const { assetData } = navigation.state.params;
    const {
      id,
      name,
      description,
      icon,
    } = assetData;

    const isOwned = collectibles.find(collectible => {
      return collectible.id === id;
    });

    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <Header
          onBack={() => { navigation.goBack(null); }}
          title={name}
        />
        <ScrollWrapper>
          <CollectibleImage
            key={id.toString()}
            source={{ uri: icon }}
            fallbackSource={genericCollectible}
            resizeMode="contain"
          />
          <DataWrapper>
            {!!description &&
              <Description small light>{description.replace(new RegExp('\\n\\n', 'g'), '\n')}</Description>
            }
          </DataWrapper>
          <ActionButtonsWrapper>
            <CircleButtonsWrapper center horizontal>
              <CircleButton
                label="Send"
                icon={iconSend}
                onPress={() => this.goToSendTokenFlow(assetData)}
                disabled={!isOwned}
              />
            </CircleButtonsWrapper>
          </ActionButtonsWrapper>
          <ActivityFeed
            feedTitle="transactions."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ type, assetData: thisAssetData }) =>
              type === COLLECTIBLE_TRANSACTION && !!thisAssetData && !!thisAssetData.id && thisAssetData.id === id)}
            backgroundColor={baseColors.white}
            noBorder
            wrapperStyle={{ marginTop: 10 }}
            invertAddon
          />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  contacts: { data: contacts },
  assets: { data: assets, balances },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
  collectibles: { assets: collectibles },
}) => ({
  wallet,
  contacts,
  assets,
  balances,
  rates,
  history,
  baseFiatCurrency,
  collectibles,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset, indexFrom));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CollectibleScreen);
