// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import isEqual from 'lodash.isequal';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';

import Header from 'components/Header';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import { SEND_COLLECTIBLE_FROM_ASSET_FLOW } from 'constants/navigationConstants';


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
  })}
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
    const { navigation } = this.props;
    const { assetData } = navigation.state.params;

    const {
      id,
      name,
      description,
      icon,
    } = assetData;

    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <Header
          onBack={() => { navigation.goBack(); }}
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
              />
            </CircleButtonsWrapper>
          </ActionButtonsWrapper>
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
}) => ({
  wallet,
  contacts,
  assets,
  balances,
  rates,
  history,
  baseFiatCurrency,
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
