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
import styled from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import ActionModal from 'components/ActionModal';
import { LabelBadge } from 'components/LabelBadge';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Toast from 'components/Toast';

// constants
import { BTC, defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_BITCOIN_FLOW, SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';
import { RECEIVE, SEND } from 'constants/walletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { calculateBitcoinBalanceInFiat } from 'utils/bitcoin';
import { findFirstSmartAccount } from 'utils/accounts';

// models, types
import type { Account } from 'models/Account';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Asset, AssetData, BalancesStore, Rates } from 'models/Asset';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  rates: Rates,
  balances: BalancesStore,
  bitcoinBalances: BitcoinBalance,
  bitcoinAddresses: BitcoinAddress[],
  supportedAssets: Asset[],
  wallets: Account[],
  activeWallet: Account,
  changeWalletAction: (acc: Account, callback: () => void) => void,
  blockchainNetwork: ?string,
  setActiveBlockchainNetwork: (id: string) => void,
};

type State = {
  visibleActionModal: string,
  receiveAddress: string,
};


const Sizer = styled.View`
  max-width: 350px;
  align-items: center;
  align-self: center;
`;

const ActionButtonsWrapper = styled.View`
  width: 100%;
  padding: 14px 10px 36px;
  flex-direction: row;
  justify-content: space-between;
`;


const getModalActionsInfo = (actionType: string) => {
  switch (actionType) {
    case ACCOUNT_TYPES.SMART_WALLET:
      return {
        title: 'Smart Wallet',
        paragraph: 'You are able to recover your wallet using another device, i.e. desktop computer.',
        children: (
          <LabelBadge label="Recommended" positive containerStyle={{ marginTop: 11, alignSelf: 'flex-start' }} />
        ),
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

  getModalActions = () => {
    const { visibleActionModal } = this.state;
    const {
      rates,
      balances,
      baseFiatCurrency,
      bitcoinBalances,
      wallets,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const accountsInfo = wallets.map((account) => {
      const { type, id } = account;
      const isBitcoin = type === BLOCKCHAIN_NETWORK_TYPES.BITCOIN;
      const accBalance = isBitcoin
        ? calculateBitcoinBalanceInFiat(rates, bitcoinBalances, fiatCurrency)
        : calculateBalanceInFiat(rates, balances[id] || {}, fiatCurrency);

      return {
        ...account,
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
        return accountsInfo.map((acc) => {
          const {
            type,
            formattedBalance,
            balance,
            additionalInfo,
            sendFlow,
          } = acc;

          return {
            key: type,
            value: formattedBalance,
            ...additionalInfo,
            onPress: () => this.navigateToAction(acc, sendFlow),
            label: `From ${additionalInfo.title}`,
            isDisabled: balance <= 0,
          };
        });
      case EXCHANGE:
        return accountsInfo.filter(({ type }) => type !== BLOCKCHAIN_NETWORK_TYPES.BITCOIN).map((acc) => {
          const {
            type,
            formattedBalance,
            additionalInfo,
            exchangeFlow,
          } = acc;
          return {
            key: type,
            value: formattedBalance,
            ...additionalInfo,
            onPress: () => this.navigateToAction(acc, exchangeFlow),
            label: `From ${additionalInfo.title}`,
          };
        });
      default:
        return [];
    }
  };

  navigateToAction = (acc: Account, navigateTo: string) => {
    const {
      navigation,
      activeWallet,
      supportedAssets,
      changeWalletAction,
      blockchainNetwork,
      setActiveBlockchainNetwork,
      wallets,
    } = this.props;
    const { type: walletType } = acc;
    const { type: activeAccType } = activeWallet;

    switch (walletType) {
      case ACCOUNT_TYPES.SMART_WALLET:
        if (blockchainNetwork !== BLOCKCHAIN_NETWORK_TYPES.ETHEREUM) {
          setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);
        }
        if (activeAccType !== ACCOUNT_TYPES.SMART_WALLET) {
          changeWalletAction(acc, () => navigation.navigate(navigateTo));
        } else {
          navigation.navigate(navigateTo);
        }
        break;

      case ACCOUNT_TYPES.KEY_BASED:
        if (blockchainNetwork !== BLOCKCHAIN_NETWORK_TYPES.ETHEREUM) {
          setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);
        }
        if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
          changeWalletAction(acc, () => navigation.navigate(navigateTo));
        } else {
          navigation.navigate(navigateTo);
        }
        break;

      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        const smartAcc = findFirstSmartAccount(wallets);
        changeWalletAction(smartAcc || acc, () => {
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
        });
        break;

      default:
        break;
    }
  };

  render() {
    const { visibleActionModal, receiveAddress } = this.state;
    const {
      balances,
      bitcoinBalances,
      bitcoinAddresses,
    } = this.props;
    const modalActions = this.getModalActions();
    const isSendButtonActive = !!Object.keys(balances).length ||
      (bitcoinAddresses.length > 0 && !!Object.keys(bitcoinBalances).length);

    return (
      <React.Fragment>
        <Sizer>
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
        </Sizer>
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
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency, blockchainNetwork } },
  rates: { data: rates },
  balances: { data: balances },
  bitcoin: { data: { addresses: bitcoinAddresses, balances: bitcoinBalances } },
  assets: {
    supportedAssets,
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  blockchainNetwork,
  rates,
  balances,
  bitcoinBalances,
  bitcoinAddresses,
  supportedAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(ActionButtons));
