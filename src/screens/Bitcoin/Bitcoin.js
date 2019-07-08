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
import { connect } from 'react-redux';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import {
  initializeBitcoinWalletAction,
  refreshAddressBalanceAction,
} from 'actions/bitcoinActions';
import { defaultFiatCurrency, BTC } from 'constants/assetsConstants';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import CheckPin from 'components/CheckPin';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { unspentAmount } from 'utils/bitcoin';
import type {
  BitcoinAddress,
  BitcoinUtxo,
} from 'models/Bitcoin';
import type { NavigationScreenProp } from 'react-navigation';
import { getRate } from 'utils/assets';
import AssetView from 'screens/Asset/AssetView';
import { Share } from 'react-native';
import { SEND_BITCOIN_ADDRESS } from 'constants/navigationConstants';
import type { Wallet } from 'models/Wallet';

const RECEIVE = 'RECEIVE';

const activeModalResetState = {
  type: null,
  opts: { address: '' },
};

type State = {
  showDescriptionModal: boolean;
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
    },
  },
};

type Props = {
  navigation: NavigationScreenProp<*>,
  addresses: BitcoinAddress[],
  initializeWallet: (wallet: Wallet) => void,
  resetIncorrectPassword: () => void,
  baseFiatCurrency: ?string,
  rates: Object,
  unspentTransactions: BitcoinUtxo[],
  refreshAddressBalance: (address: string) => void,
};

class Bitcoin extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
  };

  handleScreenDismissal = () => {
    const { resetIncorrectPassword, navigation } = this.props;

    resetIncorrectPassword();
    navigation.goBack(null);
  };

  componentDidMount() {
    this.refreshBalance();
  }

  refreshBalance() {
    const { addresses } = this.props;
    const firstAddress = addresses[0] || {};

    this.props.refreshAddressBalance(firstAddress.address);
  }

  onPinValid = (wallet: Wallet) => {
    const { initializeWallet } = this.props;

    initializeWallet(wallet);
  };

  render() {
    const { addresses, navigation } = this.props;
    const firstAddress = addresses[0] || {};
    const isInitialized = addresses.length !== 0;

    if (!isInitialized) {
      return (
        <Container>
          <Header title="enter pincode" centerTitle onClose={this.handleScreenDismissal} />
          <CheckPin revealMnemonic onPinValid={(pin, walletObj) => this.onPinValid(walletObj)} />
        </Container>
      );
    }

    const balance = isInitialized ? this.totalBalance() : 0;
    const isWalletEmpty = balance <= 0;
    const isSendActive = !isWalletEmpty;
    const isReceiveActive = isInitialized;
    const { showDescriptionModal } = this.state;

    const fiatCurrency = this.props.baseFiatCurrency || defaultFiatCurrency;
    const tokenRate = getRate(this.props.rates, BTC, fiatCurrency);
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    const displayAmount = formatMoney(balance, 4);
    const totalInFiat = isWalletEmpty ? 0 : (balance * tokenRate);
    const balanceInFiatFormatted = formatMoney(totalInFiat);

    return (
      <AssetView
        assetIsListed
        navigation={navigation}
        fiatSymbol={currencySymbol}
        displayAmount={displayAmount}
        balanceInFiatFormatted={balanceInFiatFormatted}
        assetIcon=""
        assetSymbol="BTC"
        assetName="Bitcoin"
        assetDescription=""
        showDescriptionModal={showDescriptionModal}
        onDescriptionModalHide={() => this.setState({ showDescriptionModal: false })}
        onPressReceive={() => this.openReceiveTokenModal()}
        onPressSend={() => this.goToSendTokenFlow()}
        onPressExchange={() => this.goToExchangeFlow()}
        noBalance={isWalletEmpty}
        isSendDisabled={!isSendActive}
        isReceiveDisabled={!isReceiveActive}
        isReceiveModalVisible={this.state.activeModal.type === RECEIVE}
        onReceiveModalHide={() => {
          this.setState({ activeModal: activeModalResetState });
        }}
        receiveAddress={firstAddress.address}
        onOpenShareDialog={() => this.handleOpenShareDialog()}
      />
    );
  }

  handleOpenShareDialog(): void {
    const { addresses } = this.props;
    const firstAddress = addresses[0] || {};

    Share.share({
      title: 'Public address',
      message: firstAddress.address,
    });
  }

  openReceiveTokenModal(): void {
    // TODO: create new/get unused address
    const {
      addresses,
    } = this.props;
    const { address } = addresses[0];

    this.setState({
      activeModal: {
        type: RECEIVE,
        opts: { address },
      },
    });
  }

  totalBalance(): number {
    const { unspentTransactions } = this.props;

    return unspentAmount(unspentTransactions);
  }

  goToSendTokenFlow = (): void => {
    const {
      navigation,
      addresses,
    } = this.props;

    // TODO: select address
    const { address } = addresses[0];

    navigation.navigate(SEND_BITCOIN_ADDRESS, { fromAddress: address });
  };

  goToExchangeFlow = (): void => {
    // TODO:
    // this.props.navigation.navigate(EXCHANGE, { fromAssetCode });
  };
}

const mapStateToProps = ({
  bitcoin: {
    data: {
      addresses,
      unspentTransactions,
    },
  },
  wallet,
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}) => ({
  addresses,
  wallet,
  baseFiatCurrency,
  rates,
  unspentTransactions,
});

const mapDispatchToProps = (dispatch: Function) => ({
  initializeWallet: (wallet: Wallet) => dispatch(initializeBitcoinWalletAction(wallet)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  refreshAddressBalance: (address: string) => dispatch(refreshAddressBalanceAction(address, false)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Bitcoin);
