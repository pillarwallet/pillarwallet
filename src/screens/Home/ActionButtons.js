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
import { withNavigation } from 'react-navigation';

// components
import styled, { withTheme } from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import ActionModal from 'components/ActionModal';
import { LabelBadge } from 'components/LabelBadge';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import CheckAuth from 'components/CheckAuth';
import Toast from 'components/Toast';

// constants
import { BTC, defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_BITCOIN_FLOW, SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';
import { RECEIVE, SEND } from 'constants/walletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { switchAccountAction } from 'actions/accountsActions';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { calculateBitcoinBalanceInFiat } from 'utils/bitcoin';
import { getActiveAccount } from 'utils/accounts';
import { themedColors } from 'utils/themes';

// models, types
import type { Accounts } from 'models/Account';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Asset, AssetData, BalancesStore, Rates } from 'models/Asset';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';
import type { EthereumWallet } from 'models/Wallet';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  baseFiatCurrency: ?string,
  rates: Rates,
  balances: BalancesStore,
  smartWalletFeatureEnabled: boolean,
  bitcoinFeatureEnabled: boolean,
  bitcoinBalances: BitcoinBalance,
  bitcoinAddresses: BitcoinAddress[],
  switchAccount: (accountId: string, privateKey?: string) => void,
  resetIncorrectPassword: () => void,
  toggleLoading: (messages: string) => void,
  supportedAssets: Asset[],
};

type State = {
  visibleActionModal: string,
  receiveAddress: string,
  showPinModal: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
};


const ActionButtonsWrapper = styled.View`
  padding: 36px 26px;
  flex-direction: row;
  justify-content: space-between;
  border-top-color: ${themedColors.border};
  border-top-width: 1px;
`;


const getModalActionsInfo = (actionType: string) => {
  switch (actionType) {
    case ACCOUNT_TYPES.SMART_WALLET:
      return {
        title: 'Smart Wallet',
        paragraph: 'You are able to recover your wallet using another device, i.e. desktop computer.',
        children: (<LabelBadge label="Recommended" positive containerStyle={{ marginTop: 11 }} />),
      };

    case ACCOUNT_TYPES.KEY_BASED:
      return {
        title: 'Key Wallet',
        paragraph: 'Needs to be backed up in order to enable Smart Wallet recovery.',
      };

    case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
      return {
        title: 'Bitcoin Wallet',
      };
    default:
      return {};
  }
};


class ActionButtons extends React.Component<Props, State> {
  state = {
    visibleActionModal: '',
    receiveAddress: '',
    showPinModal: false,
    onPinValidAction: null,
  };

  openActionModal = (actionModalType: string) => {
    this.setState({ visibleActionModal: actionModalType });
  };

  closeActionModal = (callback: () => void) => {
    this.setState({ visibleActionModal: '' }, () => {
      if (callback) {
        const timer = setTimeout(() => {
          callback();
          clearTimeout(timer);
        }, 500);
      }
    });
  };

  closeReceiveModal = () => {
    this.setState({ receiveAddress: '' });
  };

  handleAuthModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showPinModal: false });
  };

  getModalActions = () => {
    const { visibleActionModal } = this.state;
    const {
      rates,
      accounts: _accounts,
      balances,
      baseFiatCurrency,
      smartWalletFeatureEnabled,
      bitcoinFeatureEnabled,
      bitcoinBalances,
      bitcoinAddresses,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const keyWallet = _accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED) || {};
    const accountsToShow = [keyWallet];

    if (smartWalletFeatureEnabled) {
      const smartWallet = _accounts.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);
      if (smartWallet) accountsToShow.unshift(smartWallet);
    }

    if (bitcoinFeatureEnabled && bitcoinAddresses.length > 0) {
      const bitcoinAcc = { type: BLOCKCHAIN_NETWORK_TYPES.BITCOIN, id: bitcoinAddresses[0].address };
      accountsToShow.push(bitcoinAcc);
    }

    const accountsInfo = accountsToShow.map((account) => {
      const { type, id } = account;
      const isBitcoin = type === BLOCKCHAIN_NETWORK_TYPES.BITCOIN;
      const accBalance = isBitcoin
        ? calculateBitcoinBalanceInFiat(rates, bitcoinBalances, fiatCurrency)
        : calculateBalanceInFiat(rates, balances[id] || {}, fiatCurrency);

      return {
        type,
        balance: accBalance,
        formattedBalance: formatFiat(accBalance, fiatCurrency),
        address: id,
        additionalInfo: getModalActionsInfo(type),
        sendFlow: isBitcoin ? SEND_BITCOIN_FLOW : SEND_TOKEN_FROM_HOME_FLOW,
        exchangeFlow: EXCHANGE,
      };
    });

    switch (visibleActionModal) {
      case RECEIVE:
        return accountsInfo.map(({
          type,
          formattedBalance,
          additionalInfo,
          address,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.setState({ receiveAddress: address }),
          label: `To ${additionalInfo.title}`,
        }),
        );
      case SEND:
        return accountsInfo.map(({
          type,
          formattedBalance,
          balance,
          additionalInfo,
          sendFlow,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.navigateToAction(type, sendFlow),
          label: `From ${additionalInfo.title}`,
          isDisabled: balance <= 0,
        }),
        );
      case EXCHANGE:
        return accountsInfo.filter(({ type }) => type !== BLOCKCHAIN_NETWORK_TYPES.BITCOIN).map(({
          type,
          formattedBalance,
          additionalInfo,
          exchangeFlow,
        }) => ({
          key: type,
          value: formattedBalance,
          ...additionalInfo,
          onPress: () => this.navigateToAction(type, exchangeFlow),
          label: `From ${additionalInfo.title}`,
        }),
        );
      default:
        return [];
    }
  };

  navigateToAction = (type: string, navigateTo: string) => {
    const {
      navigation,
      accounts,
      switchAccount,
      supportedAssets,
    } = this.props;
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    const keyBasedAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.KEY_BASED) || {};

    switch (type) {
      case ACCOUNT_TYPES.SMART_WALLET:
        if (activeAccType === ACCOUNT_TYPES.SMART_WALLET) {
          navigation.navigate(navigateTo);
        } else {
          this.switchAccAndNavigate(navigateTo);
        }
        break;

      case ACCOUNT_TYPES.KEY_BASED:
        if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
          switchAccount(keyBasedAccount.id);
        }
        navigation.navigate(navigateTo);
        break;

      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        if (navigateTo === SEND_BITCOIN_FLOW) {
          const btcToken = supportedAssets.find(asset => asset.symbol === BTC);
          if (!btcToken) {
            Toast.show({
              message: 'Bitcoin is not supported',
              type: 'warning',
              title: 'Can not send Bitcoin',
              autoClose: false,
            });
            return;
          }
          const { symbol: token, decimals } = btcToken;
          const assetData: AssetData = {
            token,
            decimals,
          };
          navigation.navigate(SEND_BITCOIN_FLOW, { assetData });
        } else {
          navigation.navigate(navigateTo);
        }
        break;

      default:
        break;
    }
  };

  switchAccAndNavigate = (navigateTo: string) => {
    const {
      navigation,
      accounts,
      switchAccount,
      toggleLoading,
    } = this.props;
    const smartAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};
    toggleLoading('Changing into Smart Wallet');

    this.setState({
      showPinModal: true,
      onPinValidAction: async (_: string, wallet: Object) => {
        await switchAccount(smartAccount.id, wallet.privateKey);
        this.setState({ showPinModal: false });
        toggleLoading('');
        navigation.navigate(navigateTo);
      },
    });
  };

  render() {
    const {
      visibleActionModal,
      receiveAddress,
      showPinModal,
      onPinValidAction,
    } = this.state;
    const {
      balances,
      bitcoinBalances,
      bitcoinFeatureEnabled,
      bitcoinAddresses,
    } = this.props;
    const modalActions = this.getModalActions();
    const isSendButtonActive = !!Object.keys(balances).length ||
      (bitcoinFeatureEnabled && bitcoinAddresses.length > 0 && !!Object.keys(bitcoinBalances).length);

    return (
      <React.Fragment>
        <ActionButtonsWrapper>
          <CircleButton
            label="Receive"
            fontIcon="qrDetailed"
            onPress={() => this.openActionModal(RECEIVE)}
          />
          <CircleButton
            label="Send"
            fontIcon="paperPlane"
            onPress={() => this.openActionModal(SEND)}
            disabled={!isSendButtonActive}
          />
          <CircleButton
            label="Exchange"
            fontIcon="exchange"
            onPress={() => this.openActionModal(EXCHANGE)}
          />
        </ActionButtonsWrapper>
        <ActionModal
          onModalClose={this.closeActionModal}
          isVisible={!!visibleActionModal}
          items={modalActions}
        />
        <ReceiveModal
          isVisible={!!receiveAddress}
          address={receiveAddress}
          onModalHide={this.closeReceiveModal}
        />
        <CheckAuth
          onPinValid={onPinValidAction}
          revealMnemonic
          modalProps={{
            isVisible: showPinModal,
            onModalHide: this.handleAuthModalClose,
          }}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  balances: { data: balances },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
      BITCOIN_ENABLED: bitcoinFeatureEnabled,
    },
  },
  bitcoin: { data: { addresses: bitcoinAddresses, balances: bitcoinBalances } },
  assets: {
    supportedAssets,
  },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  baseFiatCurrency,
  rates,
  balances,
  smartWalletFeatureEnabled,
  bitcoinFeatureEnabled,
  bitcoinBalances,
  bitcoinAddresses,
  supportedAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
});

export default withNavigation(withTheme(connect(mapStateToProps, mapDispatchToProps)(ActionButtons)));
