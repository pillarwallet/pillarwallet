// @flow
import * as React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { BaseText, BoldText } from 'components/Typography';
import type { Assets, Balances } from 'models/Asset';
import { CachedImage } from 'react-native-cached-image';
import { fetchInitialAssetsAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import Header from 'components/Header';
import { Wrapper, Container } from 'components/Layout';
import Separator from 'components/Separator';
import { fontSizes, spacing } from 'utils/variables';
import { SEND_TOKEN_AMOUNT } from 'constants/navigationConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';

type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  isRefreshing: boolean,
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

class SendTokenAssetsScreen extends React.Component<Props, State> {
  state = {
    isRefreshing: false,
  };

  componentDidMount() {
    const { fetchInitialAssets, assets, wallet } = this.props;

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }
  }

  navigateToNextScreen(ethAddress, token) {
    this.props.navigation.navigate(SEND_TOKEN_AMOUNT, {
      assetData: { token },
      receiver: ethAddress,
    });
  }

  renderAsset = ({ item }) => {
    const { balances, wallet } = this.props;
    const assetBalance = balances[item.symbol].balance;
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    return (
      <TouchableOpacity onPress={() => this.navigateToNextScreen(wallet.address, item.symbol)}>
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
    this.setState({
      isRefreshing: true,
    });
    fetchAssetsBalances(assets, wallet.address);
    setTimeout(() => this.setState({ isRefreshing: false }), 1000);
  };

  render() {
    const { assets, navigation } = this.props;
    const { isRefreshing } = this.state;
    const assetsArray = Object.values(assets);
    const contact = navigation.getParam('contact', {});
    const contactUsername = contact.username;

    return (
      <Container>
        <Header title={`send to ${contactUsername}`} centerTitle onClose={navigation.dismiss} />
        <Wrapper regularPadding>
          <FlatList
            keyExtractor={item => item.symbol}
            data={assetsArray}
            renderItem={this.renderAsset}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{
              height: '100%',
            }}
            refreshing={isRefreshing}
            onRefresh={() => this.refreshAssetsList()}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet }, assets: { data: assets, balances } }) => ({
  wallet,
  assets,
  balances,
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
