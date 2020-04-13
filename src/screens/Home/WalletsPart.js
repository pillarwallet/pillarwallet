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
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';

// components
import CheckAuth from 'components/CheckAuth';
import PortfolioBalance from 'components/PortfolioBalance';
import SimpleSwitcher from 'components/Switcher/SimpleSwitcher';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

// actions
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { switchAccountAction } from 'actions/accountsActions';
import { refreshBitcoinBalanceAction } from 'actions/bitcoinActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { toggleBalanceAction } from 'actions/appSettingsActions';

// utils
import { getAccountName, getActiveAccountType } from 'utils/accounts';

// models, types
import type { Account } from 'models/Account';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';
import type { NavigationScreenProp } from 'react-navigation';

// selectors
import { activeWalletSelector, availableWalletsSelector } from 'selectors/wallets';

// partials
import ActionButtons from './ActionButtons';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  switchAccount: (accountId: string, privateKey?: string) => void,
  resetIncorrectPassword: () => void,
  activeWallet: Account,
  availableWallets: Account[],
  setActiveBlockchainNetwork: (id: string) => void,
  refreshBitcoinBalance: () => void,
  hideBalance: boolean,
  toggleBalance: () => void,
  isChanging: boolean,
  handleWalletChange: (message: string) => void,
};

type State = {
  showPinModal: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
};

const Wrapper = styled.View`
  width: 100%;
  padding-top: 40px;
`;

class WalletsPart extends React.Component<Props, State> {
  state = {
    showPinModal: false,
    onPinValidAction: null,
  };

  componentDidUpdate(prevProps: Props) {
    const { activeWallet, isChanging } = this.props;
    if (isChanging && prevProps.activeWallet !== activeWallet) {
      this.endChanging();
    }
  }

  endChanging = () => {
    const { handleWalletChange } = this.props;
    handleWalletChange('');
  };

  handleAuthModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showPinModal: false });
    this.endChanging();
  };

  getWalletTitle = () => {
    const { activeWallet } = this.props;
    const { type: activeWalletType } = activeWallet;

    switch (activeWalletType) {
      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        return 'Bitcoin Wallet';
      case ACCOUNT_TYPES.SMART_WALLET:
      case ACCOUNT_TYPES.KEY_BASED:
        return getAccountName(activeWalletType);
      default:
        return '';
    }
  };

  switchToSW = async (_: string, wallet: EthereumWallet, walletIdToChangeInto: string, callback?: () => void) => {
    const { switchAccount } = this.props;
    this.setState({ showPinModal: false });
    await switchAccount(walletIdToChangeInto, wallet.privateKey);
    if (callback) callback();
  };

  getNextWalletInLine = () => {
    const { availableWallets } = this.props;
    const currentActiveType = getActiveAccountType(availableWallets);
    const currentWalletIndex = availableWallets.findIndex(({ type }) => type === currentActiveType);
    const nextIndex = (currentWalletIndex + 1) % availableWallets.length;

    return availableWallets[nextIndex] || {};
  };

  changeAcc = (nextWallet: Account, callback?: () => void) => {
    const {
      switchAccount,
      setActiveBlockchainNetwork,
      refreshBitcoinBalance,
      handleWalletChange,
    } = this.props;
    handleWalletChange('Changing wallet');
    const { type: newWalletType, id } = nextWallet;

    switch (newWalletType) {
      case ACCOUNT_TYPES.SMART_WALLET:
        this.setState({
          showPinModal: true,
          onPinValidAction: (_: string, wallet: EthereumWallet) => this.switchToSW(_, wallet, id, callback),
        });
        break;
      case ACCOUNT_TYPES.KEY_BASED:
        switchAccount(id);
        if (callback) callback();
        break;
      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
        refreshBitcoinBalance();
        if (callback) callback();
        break;
      default:
        break;
    }
  };

  render() {
    const { showPinModal, onPinValidAction } = this.state;
    const {
      availableWallets,
      baseFiatCurrency,
      activeWallet,
      toggleBalance,
      hideBalance,
    } = this.props;

    const activeWalletTitle = this.getWalletTitle();
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const nextWallet = this.getNextWalletInLine();

    return (
      <Wrapper>
        <SimpleSwitcher
          title={activeWalletTitle}
          onPress={() => this.changeAcc(nextWallet)}
        />
        <PortfolioBalance
          fiatCurrency={fiatCurrency}
          showBalance={!hideBalance}
          toggleBalanceVisibility={toggleBalance}
        />
        <ActionButtons
          wallets={availableWallets}
          changeWalletAction={this.changeAcc}
          activeWallet={activeWallet}
        />
        <CheckAuth
          onPinValid={onPinValidAction}
          revealMnemonic
          modalProps={{
            isVisible: showPinModal,
            onModalHide: this.handleAuthModalClose,
          }}
        />
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency, hideBalance } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  hideBalance,
});

const structuredSelector = createStructuredSelector({
  activeWallet: activeWalletSelector,
  availableWallets: availableWalletsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(false)),
  toggleBalance: () => dispatch(toggleBalanceAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletsPart));
