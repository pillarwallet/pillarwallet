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
import { FlatList } from 'react-native';
import Instabug from 'instabug-reactnative';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BuyCryptoAccountNotActiveModal from 'components/BuyCryptoAccountNotActiveModal';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// constants
import {
  EXCHANGE,
  LENDING_CHOOSE_DEPOSIT,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
  RARI_DEPOSIT,
  LIQUIDITY_POOLS,
  ADD_CASH,
} from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { spacing } from 'utils/variables';
import {
  getActiveAccount,
  getAccountAddress,
  isSmartWalletAccount,
  isArchanovaAccount,
} from 'utils/accounts';

// selectors
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';

// Config constants, to be overwritten in componentDidMount
let isOffersEngineEnabled = true;
let isAaveEnabled = true;
let isPoolTogetherEnabled = true;
let isRampEnabled = true;
let isSablierEnabled = true;
let isRariEnabled = true;
let areLiquidityPoolsEnabled = true;

type Props = {
  navigation: NavigationScreenProp<*>,
  isArchanovaWalletActivated: boolean,
  accounts: Account[],
};

type Service = {|
  key: string,
  title: string,
  body: string,
  label?: string,
  action: () => any,
  disabled?: boolean,
|};

class ServicesScreen extends React.Component<Props> {
  componentDidMount() {
    /**
     * Retrieve boolean flags for services from Remote Config.
     */
    isOffersEngineEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_OFFERS_ENGINE);
    isAaveEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_AAVE);
    isPoolTogetherEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_POOL_TOGETHER);
    isRampEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_RAMP);
    isSablierEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_SABLIER);
    isRariEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_RARI);
    areLiquidityPoolsEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_LIQUIDITY_POOLS);
  }

  navigateToRouteIfArchanovaWalletActivated = (route: string) => {
    const { navigation, isArchanovaWalletActivated } = this.props;
    if (!isArchanovaWalletActivated) return;

    navigation.navigate(route);
  };

  getArchanovaSupportedServices = (): Service[] => {
    const { isArchanovaWalletActivated, accounts } = this.props;

    const isArchanovaAccountActive = isArchanovaAccount(getActiveAccount(accounts));
    const servicesDisabled = isArchanovaAccountActive && !isArchanovaWalletActivated;

    let servicesLabel;
    if (servicesDisabled) {
      servicesLabel = !isArchanovaWalletActivated
        ? t('servicesContent.label.requiresActivation')
        : t('servicesContent.label.forSmartWallet');
    }

    const archanovaSupportedServices = [];

    if (areLiquidityPoolsEnabled) {
      archanovaSupportedServices.push({
        key: 'liquidityPools',
        title: t('servicesContent.liquidityPools.title'),
        body: t('servicesContent.liquidityPools.description'),
        disabled: servicesDisabled,
        label: servicesLabel,
        action: () => this.navigateToRouteIfArchanovaWalletActivated(LIQUIDITY_POOLS),
      });
    }

    if (isAaveEnabled) {
      archanovaSupportedServices.push({
        key: 'depositPool',
        title: t('servicesContent.aaveDeposit.title'),
        body: t('servicesContent.aaveDeposit.description'),
        disabled: servicesDisabled,
        label: servicesLabel,
        action: () => this.navigateToRouteIfArchanovaWalletActivated(LENDING_CHOOSE_DEPOSIT),
      });
    }

    if (isPoolTogetherEnabled) {
      archanovaSupportedServices.push({
        key: 'poolTogether',
        title: t('servicesContent.poolTogether.title'),
        body: t('servicesContent.poolTogether.description'),
        disabled: servicesDisabled,
        label: servicesLabel,
        action: () => this.navigateToRouteIfArchanovaWalletActivated(POOLTOGETHER_DASHBOARD),
      });
    }

    if (isSablierEnabled) {
      archanovaSupportedServices.push({
        key: 'sablier',
        title: t('servicesContent.sablier.title'),
        body: t('servicesContent.sablier.description'),
        disabled: servicesDisabled,
        label: servicesLabel,
        action: () => this.navigateToRouteIfArchanovaWalletActivated(SABLIER_STREAMS),
      });
    }

    if (isRariEnabled) {
      archanovaSupportedServices.push({
        key: 'rari',
        title: t('servicesContent.rari.title'),
        body: t('servicesContent.rari.description'),
        disabled: servicesDisabled,
        label: servicesLabel,
        action: () => this.navigateToRouteIfArchanovaWalletActivated(RARI_DEPOSIT),
      });
    }

    return archanovaSupportedServices;
  };

  getServices = (): Service[] => {
    const { navigation, accounts } = this.props;

    // services are left for archanova only and will be decommissioned later
    const services = isArchanovaAccount(getActiveAccount(accounts)) ? this.getArchanovaSupportedServices() : [];

    if (isOffersEngineEnabled) {
      services.push({
        key: 'offersEngine',
        title: t('servicesContent.exchange.title'),
        body: t('servicesContent.exchange.description'),
        action: () => navigation.navigate(EXCHANGE),
      });
    }

    services.push(...this.getBuyCryptoServices());

    return services;
  };

  getBuyCryptoServices = () => {
    const buyCryptoServices = [];
    const { navigation } = this.props;

    if (isRampEnabled) {
      buyCryptoServices.push({
        key: 'ramp',
        title: t('servicesContent.ramp.title'),
        body: t('servicesContent.ramp.description'),
        action: () => navigation.navigate(ADD_CASH),
      });
    }

    return buyCryptoServices;
  };

  getCryptoPurchaseAddress = (): string | null => {
    const { accounts } = this.props;

    const activeAccount = getActiveAccount(accounts);

    if (!activeAccount || !isSmartWalletAccount(activeAccount)) {
      Modal.open(() => <BuyCryptoAccountNotActiveModal />);
      return null;
    }

    return getAccountAddress(activeAccount);
  };

  showServiceLaunchError = () => {
    Toast.show({
      message: t('toast.cryptoPurchaseLaunchFailed'),
      emoji: 'hushed',
      supportLink: true,
    });
  };

  renderServicesItem = ({ item }) => {
    const { title, body, action, disabled, label, hidden = false } = item;

    if (hidden) {
      return null;
    }
    return <ListCard title={title} subtitle={body} action={action} disabled={disabled} label={label} />;
  };

  render() {
    const services = this.getServices();

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('servicesContent.title.servicesScreen') }],
          rightItems: [{ link: t('button.support'), onPress: () => Instabug.show() }],
          sideFlex: 5,
        }}
        inset={{ bottom: 'never' }}
        tab
      >
        {(onScroll) => (
          <React.Fragment>
            <FlatList
              data={services}
              keyExtractor={(item) => item.key}
              renderItem={this.renderServicesItem}
              contentContainerStyle={{ width: '100%', padding: spacing.layoutSides, paddingBottom: 40 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          </React.Fragment>
        )}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  accounts,
});

const structuredSelector = createStructuredSelector({
  isArchanovaWalletActivated: isArchanovaAccountDeployedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(ServicesScreen);
