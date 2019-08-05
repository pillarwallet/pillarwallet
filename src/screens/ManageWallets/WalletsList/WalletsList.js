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
import { RefreshControl, FlatList, Platform } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';

// components
import { spacing, baseColors } from 'utils/variables';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// constants
import { ASSETS, WALLET_SETTINGS } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

// models
import type { Accounts, Account } from 'models/Account';

// utils
import { responsiveSize } from 'utils/ui';
import { getActiveAccount } from 'utils/accounts';
import { calculatePortfolioBalance } from 'utils/assets';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import type { Assets, Balances, Rates } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  switchAccount: Function,
  resetIncorrectPassword: Function,
  user: Object,
  blockchainNetworks: Object[],
  smartWalletFeatureEnabled?: boolean,
  balances: Balances,
  rates: Rates,
  assets: Assets,
  baseFiatCurrency: string,
}

type State = {
  showCheckPinModal: boolean,
}

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
  background-color: transparent;
  flex: 1;
`;


const iconRadius = responsiveSize(52);
const IconWrapper = styled.View`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
  background-color: ${baseColors.zircon};
  margin-right: ${spacing.medium}px;
  align-items: center;
  justify-content: center;
`;

const iconSide = responsiveSize(20);
const WalletIcon = styled.View`
  background-color: ${baseColors.electricBlueIntense};
  ${props => props.isSmart
    ? `height: ${iconSide}px;
      width: ${iconSide}px;
      border-top-right-radius: 6px;
      border-bottom-left-radius: 6px;`
    : `height: ${iconSide}px;
      width: ${iconSide}px;`}
`;

class WalletsList extends React.Component<Props, State> {
  switchToAccount: ?Account = null;

  state = {
    showCheckPinModal: false,
  };

  switchAccount = (account) => {
    const {
      switchAccount,
      navigation,
      blockchainNetworks,
      accounts,
    } = this.props;
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '' };
    const { id: activeBNetworkID } = activeBNetwork;
    const activeAccount = getActiveAccount(accounts) || { type: '' };

    if (account.type === ACCOUNT_TYPES.SMART_WALLET) {
      if (activeBNetworkID === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM && activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
        navigation.navigate(ASSETS);
      } else {
        this.switchToAccount = account;
        this.setState({ showCheckPinModal: true });
      }
    } else if (account.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(account.id);
      navigation.navigate(ASSETS);
    }
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  };

  switchToSmartWalletAccount = (_: string, wallet: Object) => {
    const { navigation } = this.props;
    if (!this.switchToAccount) return;
    this.props.switchAccount(this.switchToAccount.id, wallet.privateKey);
    this.switchToAccount = null;
    this.setState({ showCheckPinModal: false });
    navigation.navigate(ASSETS);
  };

  renderWalletListItem = ({ item }) => {
    const { type, balance } = item;
    const { navigation, blockchainNetworks, baseFiatCurrency } = this.props;
    const isSmartWallet = type === ACCOUNT_TYPES.SMART_WALLET;
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '' };
    const { id: activeBNetworkID } = activeBNetwork;
    const isActive = !!item.isActive && activeBNetworkID === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balanceInFiat = Object.keys(balance).length ? balance[fiatCurrency] : 0;
    const walletBalance = formatMoney(balanceInFiat || 0);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <SettingsItemCarded
        title={isSmartWallet ? 'Smart Wallet' : 'Key Wallet'}
        subtitle={`${currencySymbol} ${walletBalance}`}
        onMainPress={() => this.switchAccount(item)}
        onSettingsPress={() => navigation.navigate(WALLET_SETTINGS, { wallet: item })}
        isActive={isActive}
        customIcon={(
          <IconWrapper>
            <WalletIcon isSmart={isSmartWallet} />
          </IconWrapper>
        )}
      />
    );
  };

  render() {
    const {
      accounts,
      user,
      smartWalletFeatureEnabled,
      balances,
      assets,
      rates,
    } = this.props;
    const { showCheckPinModal } = this.state;
    const accountsList = smartWalletFeatureEnabled
      ? accounts
      : accounts.filter((acc) => { return acc.type === 'KEY_BASED'; });

    const accountsWithBalance = accountsList.map((acc) => {
      const accountBalances = balances[acc.id] || {};
      const balance = calculatePortfolioBalance(assets, rates, accountBalances);
      return { ...acc, balance };
    });

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          background: baseColors.jellyBean,
          light: true,
          centerItems: [
            { userIcon: true },
            { title: `${user.username}'s Ethereum wallets` },
          ],
        }}
      >
        <FlatList
          data={accountsWithBalance}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderWalletListItem}
          initialNumToRender={8}
          contentContainerStyle={{
            padding: spacing.large,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
          style={{ flexGrow: 0 }}
        />
        <SlideModal
          isVisible={showCheckPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper>
            <CheckPin onPinValid={this.switchToSmartWalletAccount} />
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  user: { data: user },
  blockchainNetwork: { data: blockchainNetworks },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  balances: { data: balances },
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  accounts,
  user,
  blockchainNetworks,
  smartWalletFeatureEnabled,
  balances,
  assets,
  rates,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletsList);
