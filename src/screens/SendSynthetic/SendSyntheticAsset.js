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
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import { Container, Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { getAssetData, getAssetsAsList } from 'utils/assets';
import Spinner from 'components/Spinner';

// actions
import { initSyntheticsServiceAction } from 'actions/syntheticsActions';

// utils, services
import { spacing, UIColors } from 'utils/variables';
import syntheticsService from 'services/synthetics';
import { makePromiseCancelable } from 'utils/common';

// constants
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import { PLR } from 'constants/assetsConstants';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// models
import type { Asset, Assets } from 'models/Asset';

// configs
import assetsConfig from 'configs/assetsConfig';
import { availableStakeSelector } from 'selectors/paymentNetwork';

type Props = {
  accountAssets: Assets,
  supportedAssets: Asset[],
  initSyntheticsService: Function,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
};

type State = {
  loadingAssets: boolean,
  availableAssets: [],
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

class SendSyntheticAsset extends React.Component<Props, State> {
  state = {
    loadingAssets: true,
    availableAssets: [],
  };
  defaultSyntheticAsset: Asset;
  syntheticServicePromise;

  constructor(props: Props) {
    super(props);
    const { accountAssets, supportedAssets, availableStake } = props;
    const assetsData = getAssetsAsList(accountAssets);
    this.defaultSyntheticAsset = {
      ...getAssetData(assetsData, supportedAssets, PLR),
      balance: availableStake,
      isSynthetic: true,
    };
  }

  componentDidMount() {
    this.props.initSyntheticsService();
    this.getAvailableSyntheticsAssets();
  }

  componentWillUnmount() {
    this.cancelSyntheticServiceRequest();
  }

  getAvailableSyntheticsAssets = () => {
    const { supportedAssets, accountAssets } = this.props;
    const assetsData = getAssetsAsList(accountAssets);
    this.syntheticServicePromise = makePromiseCancelable(syntheticsService.getDataFromLiquidityPool());
    this.syntheticServicePromise
      .request()
      .then((result) => {
        const syntheticAssets = get(result, 'output.balanceResults', []);
        const availableAssets = syntheticAssets.reduce((availableList, syntheticAsset) => {
          const assetSymbol = get(syntheticAsset, 'token.symbol');
          const assetBalance = Number(get(syntheticAsset, 'value', 0));
          const assetData = getAssetData(assetsData, supportedAssets, assetSymbol);
          if (!isEmpty(assetData) && assetBalance > 0) {
            availableList.push({
              ...assetData,
              balance: assetBalance,
              isSynthetic: true,
            });
          }
          return availableList;
        }, []);
        this.setState({ availableAssets, loadingAssets: false });
      })
      .catch(({ isCanceled }) => {
        if (!isCanceled) this.setState({ loadingAssets: false });
      });
  };

  cancelSyntheticServiceRequest = () => {
    if (this.syntheticServicePromise) this.syntheticServicePromise.cancel();
  };

  refreshAvailableSyntheticAssets = () => {
    this.setState({ loadingAssets: true }, () => {
      this.cancelSyntheticServiceRequest();
      this.getAvailableSyntheticsAssets();
    });
  };

  renderAsset = ({ item }) => {
    // asset should not render
    if (assetsConfig[item.symbol] && !assetsConfig[item.symbol].send) return null;

    const { navigation } = this.props;

    return (
      <ListItemWithImage
        onPress={() => navigation.navigate(SEND_TOKEN_CONTACTS, { assetData: item })}
        label={item.name}
        subtext={item.symbol}
        itemImageUrl={`${SDK_PROVIDER}/${item.iconUrl}?size=3`}
        fallbackSource={genericToken}
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
      />
    );
  };

  render() {
    const { loadingAssets, availableAssets } = this.state;

    const availableAssetsWithDefaultAsset = [
      this.defaultSyntheticAsset,
      ...availableAssets,
    ];

    return (
      <ContainerWithHeader
        inset={{ bottom: 0 }}
        headerProps={{ centerItems: [{ title: 'Select synthetic asset' }] }}
      >
        <ContentBackground>
          <InnerWrapper>
            {loadingAssets && <Container center><Spinner /></Container>}
            {!loadingAssets &&
              <FlatList
                keyExtractor={item => item.symbol}
                data={availableAssetsWithDefaultAsset}
                renderItem={this.renderAsset}
                ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
                refreshing={false}
                onRefresh={this.refreshAvailableSyntheticAssets}
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
  assets: { supportedAssets },
}) => ({
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  accountAssets: accountAssetsSelector,
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  initSyntheticsService: () => dispatch(initSyntheticsServiceAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendSyntheticAsset);
