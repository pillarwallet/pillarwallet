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
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';

// utils
import { getActiveAccount } from 'utils/accounts';
import { formatMoney, getCurrencySymbol, noop } from 'utils/common';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { responsiveSize } from 'utils/ui';
import { baseColors, spacing } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets } from 'models/Asset';
import type { Accounts, Account } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';

// constants
import {
  PILLAR_NETWORK_INTRO,
  ASSETS,
  SMART_WALLET_INTRO,
  WALLET_SETTINGS,
} from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

import { PPN_TOKEN } from 'configs/assetsConfig';
import { availableStakeSelector } from 'selectors/paymentNetwork';
import styled from 'styled-components/native';
import Icon from 'components/Icon';

type Props = {
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: Function,
  blockchainNetworks: Object[],
  assets: Assets,
  baseFiatCurrency: string,
  smartWalletFeatureEnabled: boolean,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: Function,
  switchAccount: Function,
  smartWalletState: Object,
}

type State = {
  showPinModal: boolean,
  changingAccount: boolean,
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

const CheckIcon = styled(Icon)`
  font-size: ${responsiveSize(14)}px;
  color: ${baseColors.electricBlue};
  position: absolute;
  top: ${spacing.mediumLarge}px;
  right: ${spacing.mediumLarge}px;
`;

const pillarNetworkIcon = require('assets/icons/icon_PPN.png');

class AccountsScreen extends React.Component<Props, State> {
  switchToWallet: ?Account = null;

  state = {
    showPinModal: false,
    changingAccount: false,
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
    this.setState({ showPinModal: false, changingAccount: true });
    const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
    await switchAccount(smartAccount.id, wallet.privateKey);

    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    this.setState({ changingAccount: false });
    navigation.navigate(ASSETS);
  };

  switchWallet = (wallet) => {
    const {
      switchAccount,
      navigation,
      accounts,
      setActiveBlockchainNetwork,
    } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);

    if (wallet.type === ACCOUNT_TYPES.SMART_WALLET) {
      if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
        navigation.navigate(ASSETS);
      } else {
        this.switchToWallet = wallet;
        this.setState({ showPinModal: true });
      }
    } else if (wallet.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(wallet.id);
      navigation.navigate(ASSETS);
    }
  };

  switchToSmartWalletAccount = async (_: string, wallet: Object) => {
    this.setState({ showPinModal: false, changingAccount: true });
    const { navigation, switchAccount } = this.props;
    if (!this.switchToWallet) return;
    await switchAccount(this.switchToWallet.id, wallet.privateKey);
    this.switchToWallet = null;
    this.setState({ changingAccount: false });
    navigation.navigate(ASSETS);
  };

  renderNetworks = ({ item }: Object) => {
    const {
      navigation,
      baseFiatCurrency,
      availableStake,
      isTankInitialised,
      smartWalletFeatureEnabled,
      blockchainNetworks,
    } = this.props;

    const {
      type = '',
      balance = {},
      id,
      action,
    } = item;

    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '' };
    const { id: activeBNetworkID } = activeBNetwork;

    if (id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK) {
      const availableStakeFormattedAmount = formatMoney(availableStake, 4);

      if (!smartWalletFeatureEnabled) return null;
      return (
        <ListCard
          {...item}
          subtitle={`Balance: ${availableStakeFormattedAmount} ${PPN_TOKEN}`}
          action={isTankInitialised
            ? this.setPPNAsActiveNetwork
            : () => navigation.navigate(PILLAR_NETWORK_INTRO)}
          note={{
            note: 'Instant, free and private transactions',
            emoji: 'sunglasses',
          }}
          iconSource={pillarNetworkIcon}
          contentWrapperStyle={{
            borderWidth: 2,
            borderColor: activeBNetworkID === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK
              ? baseColors.electricBlue
              : baseColors.white,
            borderRadius: 6,
          }}
        >
          {activeBNetworkID === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK && <CheckIcon name="check" />}
        </ListCard>
      );
    }

    const isSmartWallet = type === ACCOUNT_TYPES.SMART_WALLET || type === 'SMART_WALLET_INIT';
    const isActiveWallet = !!item.isActive && activeBNetworkID === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balanceInFiat = Object.keys(balance).length ? balance[fiatCurrency] : 0;
    const walletBalance = formatMoney(balanceInFiat || 0);
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    return (
      <SettingsItemCarded
        title={isSmartWallet ? 'Ethereum Smart Wallet' : 'Ethereum Key Wallet'}
        subtitle={`${currencySymbol} ${walletBalance}`}
        onMainPress={action ? () => action() : () => this.switchWallet(item)}
        onSettingsPress={type === 'SMART_WALLET_INIT'
          ? noop
          : () => navigation.navigate(WALLET_SETTINGS, { wallet: item })}
        isActive={isActiveWallet}
        customIcon={(
          <IconWrapper>
            <WalletIcon isSmart={isSmartWallet} />
          </IconWrapper>
        )}
      />
    );
  };

  render() {
    const { showPinModal, changingAccount } = this.state;
    const {
      accounts,
      blockchainNetworks,
      smartWalletFeatureEnabled,
      smartWalletState,
      navigation,
    } = this.props;
    const ppnNetwork = blockchainNetworks.find((network) => network.id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK)
      || null;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const showSmartWalletInitButton = !smartWalletStatus.hasAccount && smartWalletFeatureEnabled;
    const visibleAccounts = smartWalletFeatureEnabled
      ? accounts
      : accounts.filter(({ type }) => type !== ACCOUNT_TYPES.SMART_WALLET);
    const walletsToShow = showSmartWalletInitButton
      ? [...visibleAccounts, { type: 'SMART_WALLET_INIT', action: () => navigation.navigate(SMART_WALLET_INTRO) }]
      : visibleAccounts;

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
        {!changingAccount &&
        <FlatList
          data={smartWalletFeatureEnabled
            ? [...walletsToShow, ppnNetwork]
            : walletsToShow}
          keyExtractor={(item) => item.id || item.type}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderNetworks}
        />}
        {changingAccount &&
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
              onPinValid={this.switchToWallet ? this.switchToSmartWalletAccount : this.switchToSmartWalletAndGoToPPN}
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
  assets: { data: assets },
  paymentNetwork: { isTankInitialised },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
}) => ({
  accounts,
  blockchainNetworks,
  assets,
  isTankInitialised,
  smartWalletFeatureEnabled,
  baseFiatCurrency,
  smartWalletState,
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
