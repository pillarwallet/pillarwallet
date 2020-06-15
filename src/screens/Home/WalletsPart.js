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
import PortfolioBalance from 'components/PortfolioBalance';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { refreshBitcoinBalanceAction } from 'actions/bitcoinActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { toggleBalanceAction } from 'actions/appSettingsActions';

// utils
import { themedColors } from 'utils/themes';

// models, types
import type { Account } from 'models/Account';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';

// selectors
import { activeWalletSelector, availableWalletsSelector } from 'selectors/wallets';

// partials
import ActionButtons from './ActionButtons';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  switchAccount: (accountId: string) => void,
  activeWallet: Account,
  availableWallets: Account[],
  setActiveBlockchainNetwork: (id: string) => void,
  refreshBitcoinBalance: () => void,
  hideBalance: boolean,
  toggleBalance: () => void,
  handleWalletChange: (message: string) => void,
};

type State = {
  isChangingAccount: boolean,
};

const Wrapper = styled.View`
  width: 100%;
  padding-top: 40px;
  border-bottom-width: 1px;
  border-bottom-color: ${themedColors.border};
`;

class WalletsPart extends React.Component<Props, State> {
  state = {
    isChangingAccount: false,
  };

  componentDidUpdate(prevProps: Props) {
    const { activeWallet } = this.props;
    const { isChangingAccount } = this.state;
    if (isChangingAccount && prevProps.activeWallet !== activeWallet) {
      this.endChanging();
    }
  }

  endChanging = () => {
    const { handleWalletChange } = this.props;
    handleWalletChange('');
    this.setState({ isChangingAccount: false });
  };

  changeAcc = (nextWallet: Account, callback?: () => void, noFullScreenLoader?: boolean) => {
    const {
      switchAccount,
      setActiveBlockchainNetwork,
      refreshBitcoinBalance,
      handleWalletChange,
    } = this.props;

    this.setState({ isChangingAccount: true });
    if (!noFullScreenLoader) {
      handleWalletChange('Changing wallet');
    }

    const { type: newWalletType, id } = nextWallet;

    switch (newWalletType) {
      case ACCOUNT_TYPES.SMART_WALLET:
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
    const {
      availableWallets,
      baseFiatCurrency,
      activeWallet,
      toggleBalance,
      hideBalance,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    return (
      <Wrapper>
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
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(false)),
  toggleBalance: () => dispatch(toggleBalanceAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletsPart));
