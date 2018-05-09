// @flow
import * as React from 'react';
import { Animated } from 'react-native';
import { connect } from 'react-redux';
import type { Transaction } from 'models/Transaction';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import { Container, Wrapper } from 'components/Layout';
import { BCX_URL } from 'react-native-dotenv';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';


// TODO: Replace me with real address or pass in with Redux
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

type Props = {
  fetchEtherBalance: () => Function,
  assets: Object,
  wallet: Object,
}

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type State = {
  animHeaderHeight: Animated.Value,
  animHeaderTextOpacity: Animated.Value,
  isCardActive: boolean,
  activeCard: string,
  history: Transaction[],
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object
    }
  }
}

class Assets extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(150),
    animHeaderTextOpacity: new Animated.Value(1),
    isCardActive: false,
    activeCard: '',
    activeModal: activeModalResetState,
    history: [],
  };

  activeCardPositionY: number = 0;

  componentDidMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
    this.getTransactionHistory();
  }

  // TODO: Move this into Redux and pass in with rest of asset DATA
  getTransactionHistory() {
    fetch(`${BCX_URL}/wallet-client/txhistory`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      // TODO: Needs to use this.props.wallet.data.address
      body: JSON.stringify({
        address1: address,
        fromtmstmp: 0,
        address2: 'ALL',
        asset: 'ALL',
      }),
    })
      .then(res => res.json())
      .then(res => res.txHistory && Array.isArray(res.txHistory) ? res.txHistory : [])
      .then((txHistory) => {
        this.setState({
          history: txHistory.slice(0, 10), // show 10 latest transactions only
        });
      })
      .catch(() => {
        // TODO: Use proper error handling
      });
  }

  animateHeaderHeight = () => {
    const headerHeightValue = this.state.isCardActive ? 120 : 150;
    const headerTextOpacityValue = this.state.isCardActive ? 0 : 1;

    Animated.parallel([
      Animated.spring(this.state.animHeaderHeight, {
        toValue: headerHeightValue,
      }),
      Animated.spring(this.state.animHeaderTextOpacity, {
        toValue: headerTextOpacityValue,
      }),
    ]).start();
  };

  handleCardTap = (id: string) => {
    this.setState({
      isCardActive: !this.state.isCardActive,
      activeCard: id,
    }, () => {
      this.animateHeaderHeight();
    });
  };

  renderAssets() {
    const { wallet: { data: wallet }, assets: { data: assets } } = this.props;
    const {
      history,
      activeCard,
      isCardActive,
    } = this.state;
    return Object.keys(assets)
      .map(id => assets[id])
      .map((asset, index) => {
        const {
          id,
          balance,
          name,
          color,
        } = asset;
        const displayAmount = +parseFloat(balance).toFixed(4);
        const assetHistory = history.filter(({ asset: assetName }) => assetName === id);
        const activeModalOptions = { address: wallet.address };
        const sendModalOptions = { token: id };
        const defaultCardPositionTop = (index * 140) + 30;

        return (
          <AssetCard
            key={index}
            id={id}
            isCardActive={isCardActive}
            activeCardId={activeCard}
            name={name || id}
            token={id}
            amount={displayAmount}
            color={color}
            onTap={this.handleCardTap}
            defaultPositionY={defaultCardPositionTop}
            history={assetHistory}
            address={wallet.address}
          >

            <AssetButtons
              recieveOnPress={() => { this.setState({ activeModal: { type: 'SEND', opts: sendModalOptions } }); }}
              sendOnPress={() => { this.setState({ activeModal: { type: 'RECEIVE', opts: activeModalOptions } }); }}
            />

          </AssetCard>

        );
      });
  }

  render() {
    const {
      activeModal: { type: activeModalType, opts },
      animHeaderHeight,
      animHeaderTextOpacity,
    } = this.state;
    return (
      <Container>
        <Wrapper
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <Animated.View
            style={{
              backgroundColor: '#00a5ff',
              height: animHeaderHeight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Animated.Text
              style={{
                opacity: animHeaderTextOpacity,
                color: 'white',
                fontSize: 32,
              }}
            >
              £1023.45
            </Animated.Text>
          </Animated.View>

          {this.renderAssets()}

        </Wrapper>
        <ReceiveModal
          isVisible={activeModalType === 'RECEIVE'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          {...opts}
        />
        <SendModal
          isVisible={activeModalType === 'SEND'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          {...opts}
        />
      </Container>
    );
  }
}


const mapStateToProps = ({ wallet, assets }) => ({ wallet, assets });

const mapDispatchToProps = (dispatch: Function) => ({
  fetchEtherBalance: () =>
    dispatch(fetchEtherBalanceAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Assets);
