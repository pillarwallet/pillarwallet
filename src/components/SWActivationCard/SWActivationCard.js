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
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import InsightWithButton from 'components/InsightWithButton';
import ActionModal from 'components/ActionModal';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/navigationConstants';
import { getBalance, getRate } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { accountBalancesSelector } from 'selectors/balances';
import { deploySmartWalletAction } from 'actions/smartWalletActions';
import type { Balances, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { getSmartWalletStatus } from 'utils/smartWallet';

import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  message: string,
  buttonTitle: string,
  accounts: Accounts,
  smartWalletState: Object,
  onButtonPress?: () => void,
  forceRetry?: boolean,
  title?: string,
  balances: Balances,
  rates: Rates,
  baseFiatCurrency: ?string,
  deploySmartWallet: () => void,
};

type State = {
  isModalVisible: boolean,
};

class SWActivationCard extends React.Component<Props, State> {
  state = {
    isModalVisible: false,
  };

  getModalItems = () => {
    const {
      navigation, baseFiatCurrency, balances, rates, deploySmartWallet,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const ethBalance = getBalance(balances, ETH);
    const balanceInFiat = ethBalance * getRate(rates, ETH, fiatCurrency);
    const fiatAmount = formatFiat(balanceInFiat, baseFiatCurrency || defaultFiatCurrency);

    return [
      {
        label: 'I have ETH',
        money: fiatAmount,
        onPress: deploySmartWallet,
        key: 'has ETH',
      },
      {
        label: "I'd like to have some",
        chevron: true,
        onPress: () => {
          navigation.navigate(EXCHANGE, {
            fromAssetCode: fiatCurrency,
            toAssetCode: 'ETH',
          });
        },
        key: 'no ETH',
      },
    ];
  }

  render() {
    const {
      title, message, buttonTitle, accounts, smartWalletState, onButtonPress, forceRetry,
    } = this.props;
    const { isModalVisible } = this.state;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) return null;

    const { upgrade: { deploymentStarted } } = smartWalletState;

    const isDeploying = deploymentStarted
      || [
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
        SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
      ].includes(smartWalletStatus.status);

    return (
      <React.Fragment>
        <InsightWithButton
          title={title}
          description={message}
          buttonTitle={buttonTitle}
          onButtonPress={onButtonPress || (() => this.setState({ isModalVisible: true }))}
          spinner={isDeploying && !forceRetry}
        />
        <ActionModal
          isVisible={isModalVisible}
          onModalClose={(action) => {
            this.setState({ isModalVisible: false }, action);
          }}
          items={this.getModalItems()}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(SWActivationCard));
