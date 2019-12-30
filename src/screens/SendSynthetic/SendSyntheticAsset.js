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
import { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { Container, Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';
import { TooltipButton } from 'components/Button';

// actions
import { fetchAvailableSyntheticAssetsAction } from 'actions/syntheticsActions';

// utils, services
import { spacing, UIColors } from 'utils/variables';
import { formatMoney } from 'utils/common';

// constants
import { SEND_SYNTHETIC_UNAVAILABLE, SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';

// models, types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Asset, AssetData } from 'models/Asset';

// configs
import assetsConfig from 'configs/assetsConfig';
import { TOKENS } from 'constants/assetsConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAvailableSyntheticAssets: () => void,
  availableSyntheticAssets: Asset[],
  isFetchingSyntheticAssets: boolean,
};

const InnerWrapper = styled(Wrapper)`
  flex: 1;
  margin-top: ${spacing.large}px;
`;

const ContentBackground = styled(Wrapper)`
  flex: 1;
  background-color: ${UIColors.defaultBackgroundColor};
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class SendSyntheticAsset extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchAvailableSyntheticAssets();
  }

  renderAsset = ({ item }: { item: Asset }) => {
    // asset should not render
    const {
      symbol: assetSymbol,
      name: assetName,
      amount: assetAmount,
      iconUrl,
      address: contractAddress,
      decimals,
    } = item;
    if (assetsConfig[assetSymbol] && !assetsConfig[assetSymbol].send) return null;

    const { navigation } = this.props;
    const balance = assetAmount || 0;
    const isAvailable = balance > 0;
    const balanceFormatted = isAvailable ? formatMoney(balance) : '0';
    const availableLabel = isAvailable ? 'In pool' : 'Unavailable';
    const assetData: AssetData = {
      token: assetSymbol,
      name: assetName,
      icon: iconUrl,
      tokenType: TOKENS,
      amount: assetAmount,
      contractAddress,
      decimals,
    };
    const onPress = isAvailable ? () => navigation.navigate(SEND_TOKEN_CONTACTS, { assetData }) : null;

    return (
      <ListItemWithImage
        onPress={onPress}
        label={assetName}
        itemImageUrl={`${SDK_PROVIDER}/${iconUrl}?size=3`}
        fallbackSource={genericToken}
        balance={{
          syntheticBalance: balanceFormatted,
          value: availableLabel,
          token: assetSymbol,
          custom: !isAvailable && (
            <TooltipButton onPress={() => navigation.navigate(SEND_SYNTHETIC_UNAVAILABLE, { assetSymbol })} />
          ),
        }}
      />
    );
  };

  render() {
    const {
      fetchAvailableSyntheticAssets,
      availableSyntheticAssets,
      isFetchingSyntheticAssets,
    } = this.props;

    return (
      <ContainerWithHeader
        inset={{ bottom: 0 }}
        headerProps={{ centerItems: [{ title: 'Choose asset' }] }}
      >
        <ContentBackground>
          <InnerWrapper>
            {isFetchingSyntheticAssets && <Container center><Spinner /></Container>}
            {!isFetchingSyntheticAssets &&
              <FlatList
                keyExtractor={item => item.symbol}
                data={availableSyntheticAssets}
                renderItem={this.renderAsset}
                refreshing={isFetchingSyntheticAssets}
                onRefresh={() => fetchAvailableSyntheticAssets()}
                ListEmptyComponent={
                  <Wrapper
                    fullScreen
                    style={{
                      paddingTop: 90,
                      paddingBottom: 90,
                      alignItems: 'center',
                    }}
                  >
                    <EmptyStateParagraph
                      title="No assets to send"
                      bodyText="None synthetic assets currently have available liquidity"
                    />
                  </Wrapper>
                }
              />
            }
          </InnerWrapper>
        </ContentBackground>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  synthetics: {
    data: availableSyntheticAssets,
    isFetching: isFetchingSyntheticAssets,
  },
}: RootReducerState): $Shape<Props> => ({
  availableSyntheticAssets,
  isFetchingSyntheticAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAvailableSyntheticAssets: () => dispatch(fetchAvailableSyntheticAssetsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendSyntheticAsset);
