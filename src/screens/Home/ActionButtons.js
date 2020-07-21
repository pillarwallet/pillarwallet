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
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

// components
import styled from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import ActionModal from 'components/ActionModal';
import { LabelBadge } from 'components/LabelBadge';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import ActionOptionsModal from 'components/ActionModal/ActionOptionsModal';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';
import { RECEIVE, SEND } from 'constants/walletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { isSupportedAccountType } from 'utils/accounts';

// models, types
import type { Account } from 'models/Account';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Asset, BalancesStore, Rates } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  rates: Rates,
  balances: BalancesStore,
  supportedAssets: Asset[],
  wallets: Account[],
  activeWallet: Account,
  changeWalletAction: (acc: Account, callback: () => void) => void,
  blockchainNetwork: ?string,
  setActiveBlockchainNetwork: (id: string) => void,
  goToInvitationFlow: () => void,
  rewardActive?: boolean,
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
      wallets,
      activeWallet,
      rewardActive,
      goToInvitationFlow,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const { id: activeAddress } = activeWallet;

    const accountsInfo = wallets.map((account) => {
      const { type, id } = account;
      const accBalance = calculateBalanceInFiat(rates, balances[id] || {}, fiatCurrency);

      return {
        ...account,
        balance: accBalance,
        formattedBalance: formatFiat(accBalance, fiatCurrency),
        address: id,
        additionalInfo: getModalActionsInfo(type),
        sendFlow: SEND_TOKEN_FROM_HOME_FLOW,
        exchangeFlow: EXCHANGE,
      };
    });

    switch (visibleActionModal) {
      case RECEIVE:
        return [
          {
            key: 'buy',
            label: `Buy with a card${Platform.OS === 'ios' ? ' or Apple Pay' : ''}`,
            iconName: 'wallet',
            onPress: () => this.navigateToAction(activeWallet, EXCHANGE, { fromAssetCode: fiatCurrency }),
          },
          {
            key: 'receive',
            label: 'Send from another wallet',
            iconName: 'qrDetailed',
            onPress: () => this.setState({ receiveAddress: activeAddress }),
          },
          {
            key: 'exchange',
            label: 'Exchange',
            iconName: 'flip',
            onPress: () => this.navigateToAction(activeWallet, EXCHANGE),
          },
          {
            key: 'invite',
            label: 'Invite and earn free tokens',
            iconName: 'present',
            hide: !rewardActive,
            onPress: goToInvitationFlow,
          },
        ];
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
        return accountsInfo.filter(({ type }) => isSupportedAccountType(type)).map((acc) => {
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

  navigateToAction = (acc: Account, navigateTo: string, params?: Object) => {
    const {
      navigation,
      activeWallet,
      changeWalletAction,
      blockchainNetwork,
      setActiveBlockchainNetwork,
    } = this.props;
    const { type: walletType } = acc;
    const { type: activeAccType } = activeWallet;

    switch (walletType) {
      case ACCOUNT_TYPES.SMART_WALLET:
        if (blockchainNetwork !== BLOCKCHAIN_NETWORK_TYPES.ETHEREUM) {
          setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);
        }
        if (activeAccType !== ACCOUNT_TYPES.SMART_WALLET) {
          changeWalletAction(acc, () => navigation.navigate(navigateTo, params));
        } else {
          navigation.navigate(navigateTo, params);
        }
        break;

      case ACCOUNT_TYPES.KEY_BASED:
        if (blockchainNetwork !== BLOCKCHAIN_NETWORK_TYPES.ETHEREUM) {
          setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);
        }
        if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
          changeWalletAction(acc, () => navigation.navigate(navigateTo, params));
        } else {
          navigation.navigate(navigateTo, params);
        }
        break;

      default:
        break;
    }
  };

  render() {
    const { visibleActionModal, receiveAddress } = this.state;
    const { balances } = this.props;
    const modalActions = this.getModalActions();
    const isSendButtonActive = !!Object.keys(balances).length;

    return (
      <React.Fragment>
        <Sizer>
          <ActionButtonsWrapper>
            <CircleButton
              label="Add Funds"
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
        <ActionOptionsModal
          onModalClose={this.closeActionModal}
          isVisible={!!visibleActionModal && visibleActionModal === RECEIVE}
          items={modalActions}
          title="Add funds to Pillar"
        />
        <ActionModal
          onModalClose={this.closeActionModal}
          isVisible={!!visibleActionModal && visibleActionModal !== RECEIVE}
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
  assets: {
    supportedAssets,
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  blockchainNetwork,
  rates,
  balances,
  supportedAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(ActionButtons));
