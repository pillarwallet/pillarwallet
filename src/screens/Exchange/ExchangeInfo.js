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
import Intercom from 'react-native-intercom';
import { FlatList, RefreshControl } from 'react-native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import Separator from 'components/Separator';

// constants
import { EXCHANGE } from 'constants/navigationConstants';

// actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// utils
import { fontStyles, spacing } from 'utils/variables';

// models, types
import type { Assets } from 'models/Asset';
import type { Allowance } from 'models/Offer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// assets
import PROVIDERS_META from 'assets/exchange/providersMeta.json';


type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  exchangeAllowances: Allowance[],
  fetchTransactionsHistory: Function,
};

type State = {
  openCollapseKey: string,
};


const SectionTitle = styled(MediumText)`
  ${fontStyles.medium};
  margin: 16px;
`;

const ProviderItem = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${spacing.large}px;
  padding-left: 44px;
`;

const ProviderName = styled(BaseText)`
  ${fontStyles.medium};
`;

const ProviderStatus = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ isPending, theme }) => isPending ? theme.colors.secondaryText : theme.colors.positive};
`;


class ExchangeInfo extends React.Component<Props, State> {
  state = {
    openCollapseKey: '',
  };

  componentDidUpdate(prevProps: Props) {
    const { navigation, exchangeAllowances } = this.props;
    // Navigating from empty settings screen automatically
    if ((prevProps.exchangeAllowances !== exchangeAllowances)
      && isEmpty(exchangeAllowances)) {
      navigation.navigate(EXCHANGE);
    }
  }

  toggleCollapse = (key: string) => {
    const { openCollapseKey } = this.state;
    if (openCollapseKey === key) {
      this.setState({ openCollapseKey: '' });
    } else {
      this.setState({ openCollapseKey: key });
    }
  };

  renderProvider = ({ item: { provider, enabled: providerEnabled } }: Object) => {
    const providerInfo = PROVIDERS_META.find(({ shim }) => shim === provider) || {};
    const { name } = providerInfo;
    const providerName = name || 'Unknown';
    return (
      <ProviderItem>
        <ProviderName>{providerName}</ProviderName>
        <ProviderStatus isPending={!providerEnabled}>
          {providerEnabled
            ? 'Enabled'
            : 'Pending'
          }
        </ProviderStatus>
      </ProviderItem>
    );
  };

  renderToken = ({ item: token }: Object) => {
    const { exchangeAllowances } = this.props;
    const { openCollapseKey } = this.state;
    const fullIconUrl = `${SDK_PROVIDER}/${token.iconUrl}?size=3`;
    const tokenAllowances = exchangeAllowances.filter(({ fromAssetCode }) => fromAssetCode === token.symbol);

    return (
      <CollapsibleListItem
        label={token.symbol}
        open={openCollapseKey === token.id}
        onPress={() => this.toggleCollapse(token.id)}
        customToggle={(
          <ListItemWithImage
            label={token.name}
            itemImageUrl={fullIconUrl}
            fallbackToGenericToken
          />
        )}
        collapseContent={
          <FlatList
            data={tokenAllowances}
            keyExtractor={({ provider, fromAssetCode }) => `${provider}-${fromAssetCode}`}
            renderItem={this.renderProvider}
            initialNumToRender={8}
            onEndReachedThreshold={0.5}
            style={{ width: '100%', paddingLeft: 2 }}
            ItemSeparatorComponent={() => <Separator />}
          />
        }
      />
    );
  };

  render() {
    const {
      assets,
      exchangeAllowances,
      fetchTransactionsHistory,
    } = this.props;
    const assetsArray = Object.keys(assets)
      .map(id => assets[id])
      .filter(({ symbol }) => exchangeAllowances.find(({ fromAssetCode }) => fromAssetCode === symbol));

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Settings' }],
          rightItems: [{ link: 'Support', onPress: () => Intercom.displayMessenger() }],
          sideFlex: 2,
        }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper>
          {!isEmpty(assetsArray) &&
            <React.Fragment>
              <SectionTitle>Enabled exchange assets:</SectionTitle>
              <FlatList
                data={assetsArray}
                keyExtractor={(item) => item.id}
                renderItem={this.renderToken}
                initialNumToRender={8}
                onEndReachedThreshold={0.5}
                style={{ width: '100%' }}
                ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => fetchTransactionsHistory()}
                  />
                }
              />
            </React.Fragment>
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  exchange: { data: { allowances: exchangeAllowances } },
}: RootReducerState): $Shape<Props> => ({
  exchangeAllowances,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeInfo);
