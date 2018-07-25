// @flow
import * as React from 'react';
import { Animated, Easing, Share, RefreshControl } from 'react-native';
import { baseColors } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import {
  fetchAssetsBalancesAction,
  fetchExchangeRatesAction,
} from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import TXHistory from 'components/TXHistory';
import ButtonIcon from 'components/ButtonIcon';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import ReceiveModal from './ReceiveModal';

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchExchangeRates: (assets: Assets) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  history: Transaction[],
  assets: Assets,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
}

type State = {
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
}

const CloseButton = styled(ButtonIcon)`
  margin-right: 16px;
  margin-bottom: 4px;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
`;

const AssetCardWrapper = styled(Wrapper)`
  flex: 1;
`;

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
  };

  static navigationOptions = {
    transitionConfig: {
      duration: 200,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { initialModalState } = nextProps.navigation.state.params;
    const activeModalInitialState = {
      type: initialModalState,
      opts: {},
    };

    if (initialModalState !== prevState.activeModal) {
      return {
        ...prevState,
        activeModal: activeModalInitialState,
      };
    }
    return null;
  }

  componentDidMount() {
    const {
      fetchTransactionsHistory,
      wallet,
      navigation,
    } = this.props;
    const { assetData } = navigation.state.params;
    fetchTransactionsHistory(wallet.address, assetData.token);
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      assetData,
    });
  };

  openReceiveTokenModal = (assetData) => {
    this.setState({
      activeModal: {
        type: 'RECEIVE',
        opts: { address: assetData.address },
      },
    });
  };

  render() {
    const { assetData } = this.props.navigation.state.params;
    const {
      assets,
      wallet,
      fetchAssetsBalances,
      fetchExchangeRates,
      fetchTransactionsHistory,
    } = this.props;
    const history = this.props.history
      .filter(({ asset }) => asset === assetData.token)
      .sort((a, b) => b.timestamp - a.timestamp);
    return (
      <Container>
        <CloseButton
          icon="close"
          onPress={this.handleCardTap}
          color={baseColors.black}
        />
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances(assets, wallet.address);
                fetchExchangeRates(assets);
                fetchTransactionsHistory(wallet.address, assetData.token);
              }}
            />
          }
        >
          <AssetCardWrapper regularPadding>
            <Transition shared={assetData.name}>
              <AssetCard
                id={assetData.token}
                name={assetData.name}
                token={assetData.token}
                amount={assetData.amount}
                balanceInFiat={assetData.balanceInFiat}
                color={assetData.color}
                onPress={this.handleCardTap}
                address={assetData.address}
                icon={assetData.icon}
                wallpaper={assetData.wallpaper}
              />
            </Transition>
            <Paragraph light>
              {assetData.description}
            </Paragraph>
            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal(assetData)}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
            />
          </AssetCardWrapper>
          <TXHistory
            history={history}
            token={assetData.token}
          />
        </ScrollWrapper>

        <ReceiveModal
          isVisible={this.state.activeModal.type === 'RECEIVE'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          address={assetData.address}
          token={assetData.token}
          tokenName={assetData.name}
          handleOpenShareDialog={this.handleOpenShareDialog}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  assets,
  assetsState,
  rates,
  baseFiatCurrency,
  history,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchExchangeRates: (assets) => {
    dispatch(fetchExchangeRatesAction(assets));
  },
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetScreen);
