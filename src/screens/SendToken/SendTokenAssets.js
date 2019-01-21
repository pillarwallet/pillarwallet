// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import type { Assets, Balances } from 'models/Asset';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ScrollWithShadow from 'components/ScrollWithShadow';
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

const genericToken = require('assets/images/tokens/genericToken.png');

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
      <ListItemWithImage
        onPress={() => this.navigateToNextScreen(nextScreenAssetData)}
        label={item.name}
        itemImageUrl={fullIconUrl}
        fallbackSource={genericToken}
        itemValue={`${assetBalance} ${item.symbol}`}
      />
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
      <Container inset={{ bottom: 0 }}>
        <Header title={`send to ${contactUsername}`} centerTitle onBack={navigation.dismiss} />
        <ScrollWithShadow
          keyExtractor={item => item.symbol}
          data={nonEmptyAssets}
          renderItem={this.renderAsset}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          refreshing={false}
          onRefresh={() => this.refreshAssetsList()}
          ListEmptyComponent={
            <Wrapper
              fullScreen
              style={{
                paddingTop: 90,
                paddingBottom: 90,
                alignItems: 'center',
              }}
            >
              <EmptyStateParagraph title="No assets to send" bodyText="None of your assets have a balance" />
            </Wrapper>
          }
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
