// @flow
import * as React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { BaseText, BoldText } from 'components/Typography';
import type { Asset, Assets, Balances } from 'models/Asset';
import { CachedImage } from 'react-native-cached-image';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import Separator from 'components/Separator';
import { fontSizes, spacing } from 'utils/variables';
import { formatAmount } from 'utils/common';
import { getBalance } from 'utils/assets';
import { SEND_TOKEN_AMOUNT } from 'constants/navigationConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';
import assetsConfig from 'configs/assetsConfig';

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type NextScreenAssetData = {
  ethAddress: string,
  token: string,
  contractAddress: string,
  decimals: number,
  icon: string,
};

const TokenName = styled(BoldText)`
  font-size: ${fontSizes.small};
`;

const TokenListItem = styled.View`
  margin: 0;
  padding: ${spacing.rhythm / 2}px 0;
  flex-direction: row;
  align-items: center;
`;

const TokenThumbnail = styled(CachedImage)`
  width: 44px;
  height: 44px;
  margin-right: ${spacing.rhythm / 2}px;
  border-radius: 22px;
`;

const TokenBalance = styled(BaseText)`
  margin-left: auto;
  font-size: ${fontSizes.medium};
`;

class SendTokenAssetsScreen extends React.Component<Props, {}> {
  navigateToNextScreen(nextScreenAssetData: NextScreenAssetData) {
    const {
      ethAddress,
      token,
      contractAddress,
      decimals,
      icon,
    } = nextScreenAssetData;

    this.props.navigation.navigate(SEND_TOKEN_AMOUNT, {
      assetData: {
        token,
        contractAddress,
        decimals,
        icon,
      },
      receiver: ethAddress,
    });
  }

  renderAsset = ({ item }) => {
    const { balances, navigation } = this.props;
    const contact = navigation.getParam('contact', {});
    const assetBalance = formatAmount(getBalance(balances, item.symbol));
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const fullIconMonoUrl = `${SDK_PROVIDER}/${item.iconMonoUrl}?size=2`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    const nextScreenAssetData = {
      token: item.symbol,
      contractAddress: item.address,
      decimals: item.decimals,
      ethAddress: contact.ethAddress,
      icon: fullIconMonoUrl,
    };
    if (assetShouldRender) {
      return null;
    }
    return (
      <TouchableOpacity onPress={() => this.navigateToNextScreen(nextScreenAssetData)}>
        <TokenListItem>
          <TokenThumbnail source={{ uri: fullIconUrl }} />
          <TokenName>{item.name}</TokenName>
          <TokenBalance>
            {assetBalance} {item.symbol}
          </TokenBalance>
        </TokenListItem>
      </TouchableOpacity>
    );
  };

  refreshAssetsList = () => {
    const { assets, fetchAssetsBalances, wallet } = this.props;
    fetchAssetsBalances(assets, wallet.address);
  };

  render() {
    const { assets, balances, navigation } = this.props;
    const assetsArray = Object.values(assets);
    const nonEmptyAssets = assetsArray.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0;
    });
    const contact = navigation.getParam('contact', {});
    const contactUsername = contact.username;
    return (
      <Container>
        <Header title={`send to ${contactUsername}`} centerTitle onBack={navigation.dismiss} />
        <FlatList
          keyExtractor={item => item.symbol}
          data={nonEmptyAssets}
          renderItem={this.renderAsset}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={{
            flexGrow: 1,
            paddingLeft: spacing.rhythm,
            paddingRight: spacing.rhythm,
          }}
          refreshing={false}
          onRefresh={() => this.refreshAssetsList()}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, balances },
}) => ({
  wallet,
  assets,
  balances,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenAssetsScreen);
