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
import { FlatList, Platform } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ListCard } from 'components/ListItem/ListCard';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import Spinner from 'components/Spinner';

// utils
import { getActiveAccount } from 'utils/accounts';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { calculatePortfolioBalance } from 'utils/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, Rates } from 'models/Asset';
import type { Accounts } from 'models/Account';

// constants
import { PILLAR_NETWORK_INTRO, ASSETS, WALLETS_LIST } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import { PPN_TOKEN } from 'configs/assetsConfig';
import { availableStakeSelector } from 'selectors/paymentNetwork';
import styled from 'styled-components/native';

type Props = {
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: Function,
  blockchainNetworks: Object[],
  balances: Balances,
  rates: Rates,
  assets: Assets,
  baseFiatCurrency: string,
  smartWalletFeatureEnabled: boolean,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: Function,
  switchAccount: Function,
}

type State = {
  showPinModal: boolean,
  changingNetwork: boolean,
}

const Wrapper = styled.View`
  flex: 1;
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
  justify-content: center;
  align-items: center;
`;

const pillarNetworkIcon = require('assets/icons/icon_PPN.png');
const ethereumNetworkIcon = require('assets/icons/icon_ethereum_network.png');

class AccountsScreen extends React.Component<Props, State> {
  state = {
    showPinModal: false,
    changingNetwork: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinModal: false,
    });
  };

  setPPNAsActiveNetwork = () => {
    const { setActiveBlockchainNetwork, navigation, accounts } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };

    if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
      navigation.navigate(ASSETS);
    } else {
      this.setState({ showPinModal: true });
    }
  };

  switchToSmartWalletAndGoToPPN = async (_: string, wallet: Object) => {
    const {
      accounts,
      setActiveBlockchainNetwork,
      switchAccount,
      navigation,
    } = this.props;
    this.setState({ showPinModal: false, changingNetwork: true });
    const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
    await switchAccount(smartAccount.id, wallet.privateKey);

    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    this.setState({ changingNetwork: false });
    navigation.navigate(ASSETS);
  };

  renderNetworks = ({ item: network }: Object) => {
    const {
      navigation,
      baseFiatCurrency,
      balances,
      rates,
      assets,
      availableStake,
      isTankInitialised,
      smartWalletFeatureEnabled,
    } = this.props;
    const { id } = network;

    const ppnNote = {
      note: 'Instant, free and private transactions',
      emoji: 'sunglasses',
    };

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const allBalances = Object.keys(balances).map((account) => {
      const portfolioBalance = calculatePortfolioBalance(assets, rates, balances[account]);
      return Object.keys(portfolioBalance).length ? portfolioBalance[fiatCurrency] : 0;
    });

    const combinedBalance = allBalances.reduce((a, b) => a + b, 0);
    const combinedFormattedBalance = formatMoney(combinedBalance || 0);

    const currencySymbol = getCurrencySymbol(fiatCurrency);
    const availableStakeFormattedAmount = formatMoney(availableStake, 4);

    switch (id) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return (
          <ListCard
            {...network}
            action={() => navigation.navigate(WALLETS_LIST)}
            subtitle={`Balance: ${currencySymbol} ${combinedFormattedBalance}`}
            iconSource={ethereumNetworkIcon}
          />
        );
      case BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK:
        if (!smartWalletFeatureEnabled) return null;
        return (
          <ListCard
            {...network}
            subtitle={`Balance: ${availableStakeFormattedAmount} ${PPN_TOKEN}`}
            action={isTankInitialised
              ? this.setPPNAsActiveNetwork
              : () => navigation.navigate(PILLAR_NETWORK_INTRO)}
            note={ppnNote}
            iconSource={pillarNetworkIcon}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { showPinModal, changingNetwork } = this.state;
    const { blockchainNetworks, smartWalletFeatureEnabled } = this.props;

    return (
      <ContainerWithHeader
        headerProps={{
          leftItems: [
            { userIcon: true },
            { title: 'Accounts' },
          ],
          rightItems: [{ close: true, dismiss: true }],
        }}
      >
        {!changingNetwork &&
        <FlatList
          data={smartWalletFeatureEnabled
            ? blockchainNetworks
            : blockchainNetworks.filter((network) => network.type !== BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK)}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderNetworks}
        />}
        {changingNetwork &&
        <Wrapper>
          <Spinner />
        </Wrapper>}

        <SlideModal
          isVisible={showPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper>
            <CheckPin
              onPinValid={this.switchToSmartWalletAndGoToPPN}
            />
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  blockchainNetwork: { data: blockchainNetworks },
  balances: { data: balances },
  assets: { data: assets },
  rates: { data: rates },
  paymentNetwork: { isTankInitialised },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  accounts,
  blockchainNetworks,
  balances,
  assets,
  rates,
  isTankInitialised,
  smartWalletFeatureEnabled,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen);
