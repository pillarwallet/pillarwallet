// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { BoldText, LightText } from 'components/Typography';
import type { Assets, Balances } from 'models/Asset';
import { CachedImage } from 'react-native-cached-image';
import { fetchInitialAssetsAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import Separator from 'components/Separator';
import { formatMoney } from 'utils/common';
import { fontSizes, baseColors } from 'utils/variables';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';

type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
};

const TokenName = styled(BoldText)`
  font-size: ${fontSizes.small};
`;

const TokenSymbol = styled(LightText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.small};
`;

const TokenListItem = styled.View`
  margin: 0;
  flex-direction: row;
`;

const TokenThumbnail = styled(CachedImage)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
`;

const Body = styled.View``;
const Right = styled.View``;

class SendTokenAssetsScreen extends React.Component<Props> {
  componentDidMount() {
    const { fetchInitialAssets, assets, wallet } = this.props;

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }
  }

  handleCardTap = (assetData: Object) => {
    this.props.navigation.navigate(ASSET, {
      assetData,
    });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  };

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, {
      asset,
    });
  };

  renderAssets() {
    const {
      wallet, assets, balances, rates, baseFiatCurrency,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: Number(balances[symbol] && balances[symbol].balance) || 0,
        ...rest,
      }))
      .map(({ balance, symbol, ...rest }) => ({
        balance,
        symbol,
        balanceInFiat: rates[symbol] ? balance * rates[symbol][fiatCurrency] : 0,
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat)
      .map(asset => {
        const {
          name, symbol, balanceInFiat, balance, iconUrl, decimals,
        } = asset;

        const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

        const formattedBalanceInFiat = formatMoney(balanceInFiat);
        const displayAmount = formatMoney(balance, 4);

        const assetData = {
          name: name || symbol,
          token: symbol,
          amount: displayAmount,
          contractAddress: asset.address,
          description: asset.description,
          balance,
          balanceInFiat: { amount: formattedBalanceInFiat, currency: fiatCurrency },
          address: wallet.address,
          icon: fullIconUrl,
          decimals,
        };
        return (
          <TokenListItem key={assetData.token}>
            <TokenThumbnail source={{ uri: fullIconUrl }} />
            <Body style={{ marginLeft: 20 }}>
              <TokenName>{assetData.name}</TokenName>
              <TokenSymbol>{assetData.token}</TokenSymbol>
            </Body>
            <Right />
          </TokenListItem>
        );
      });
  }

  renderAsset = ({ asset }) => {
    const fullIconUrl = `${SDK_PROVIDER}/${asset.iconUrl}?size=3`;
    return (
      <TokenListItem key={asset.token}>
        {console.log(asset)}
        <TokenThumbnail source={{ uri: fullIconUrl }} />
        <TokenName>{asset.name}</TokenName>
      </TokenListItem>
    );
  };

  render() {
    const { assets, wallet } = this.props;

    return (
      <Container>
        <Header title="send to X" centerTitle headerRightFlex="2" />
        {this.renderAssets()}
        <FlatList
          data={assets}
          renderItem={this.renderAsset}
          ItemSeparatorComponent={Separator}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState, balances },
  rates: { data: rates },
  appSettings: {
    data: { baseFiatCurrency },
  },
}) => ({
  wallet,
  assets,
  assetsState,
  balances,
  rates,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: walletAddress => {
    dispatch(fetchInitialAssetsAction(walletAddress));
  },
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SendTokenAssetsScreen);
