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
import { FlatList, Alert } from 'react-native';
import { connect } from 'react-redux';
import Intercom from 'react-native-intercom';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { loadAltalixAvailability } from 'actions/fiatToCryptoActions';

// components
import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BuyCryptoAccountWarnModal, { ACCOUNT_MSG } from 'components/BuyCryptoAccountWarnModal';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// constants
import {
  EXCHANGE,
  LENDING_CHOOSE_DEPOSIT,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
  SENDWYRE_INPUT,
  WBTC_CAFE,
  RARI_DEPOSIT,
  LIQUIDITY_POOLS,
} from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { spacing } from 'utils/variables';
import { openInAppBrowser } from 'utils/inAppBrowser';
import {
  getActiveAccount,
  getAccountAddress,
  checkIfLegacySmartWalletAccount,
} from 'utils/accounts';
import { rampWidgetUrl, wyreWidgetUrl, altalixWidgetUrl } from 'utils/fiatToCrypto';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { User } from 'models/User';
import type { SendwyreTrxValues } from 'models/FiatToCryptoProviders';
import type SDKWrapper from 'services/api';

// Config constants, to be overwritten in componentDidMount
let isOffersEngineEnabled = true;
let isAaveEnabled = true;
let isPoolTogetherEnabled = true;
let isWyreEnabled = true;
let isRampEnabled = true;
let isSablierEnabled = true;
let isAltalixEnabled = true;
let isWBTCCafeEnabled = true;
let isRariEnabled = true;
let areLiquidityPoolsEnabled = true;

type Props = {
  navigation: NavigationScreenProp<*>,
  getMetaData: () => void,
  user: User,
  accounts: Accounts,
  getApi: () => SDKWrapper,
  isAltalixAvailable: null | boolean,
  loadAltalixInfo: () => void,
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
    const { isAltalixAvailable, loadAltalixInfo } = this.props;

    /**
     * Retrieve boolean flags for services from Remote Config.
     */
    isOffersEngineEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_OFFERS_ENGINE);
    isAaveEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_AAVE);
    isPoolTogetherEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_POOL_TOGETHER);
    isWyreEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_WYRE);
    isRampEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_RAMP);
    isSablierEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_SABLIER);
    isAltalixEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_ALTALIX);
    isWBTCCafeEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.WBTC_CAFE);
    isRariEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_RARI);
    areLiquidityPoolsEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_LIQUIDITY_POOLS);

    if (isAltalixAvailable === null) loadAltalixInfo();
  }

  getServices = (): Service[] => {
    const { navigation } = this.props;

    const services = [];
    if (isOffersEngineEnabled) {
      services.push({
        key: 'offersEngine',
        title: t('servicesContent.exchange.title'),
        body: t('servicesContent.exchange.description'),
        action: () => navigation.navigate(EXCHANGE),
      });
    }
    services.push(...this.getBuyCryptoServices());
    if (areLiquidityPoolsEnabled) {
      services.push({
        key: 'liquidityPools',
        title: t('servicesContent.liquidityPools.title'),
        body: t('servicesContent.liquidityPools.description'),
        action: () => navigation.navigate(LIQUIDITY_POOLS),
      });
    }
    if (isAaveEnabled) {
      services.push({
        key: 'depositPool',
        title: t('servicesContent.aaveDeposit.title'),
        body: t('servicesContent.aaveDeposit.description'),
        action: () => navigation.navigate(LENDING_CHOOSE_DEPOSIT),
      });
    }
    if (isPoolTogetherEnabled) {
      services.push({
        key: 'poolTogether',
        title: t('servicesContent.poolTogether.title'),
        body: t('servicesContent.poolTogether.description'),
        action: () => navigation.navigate(POOLTOGETHER_DASHBOARD),
      });
    }
    if (isSablierEnabled) {
      services.push({
        key: 'sablier',
        title: t('servicesContent.sablier.title'),
        body: t('servicesContent.sablier.description'),
        action: () => navigation.navigate(SABLIER_STREAMS),
      });
    }
    if (isWBTCCafeEnabled) {
      services.push({
        key: 'wbtc',
        title: t('wbtcCafe.cafe'),
        body: t('wbtcCafe.trade'),
        action: () => navigation.navigate(WBTC_CAFE),
      });
    }
    if (isRariEnabled) {
      services.push({
        key: 'rari',
        title: t('servicesContent.rari.title'),
        body: t('servicesContent.rari.description'),
        action: () => navigation.navigate(RARI_DEPOSIT),
      });
    }

    return services;
  };

  getBuyCryptoServices = () => {
    const buyCryptoServices = [];
    const { isAltalixAvailable, user, getApi } = this.props;

    const walletId = user?.walletId;

    if (isRampEnabled) {
      buyCryptoServices.push({
        key: 'ramp',
        title: t('servicesContent.ramp.title'),
        body: t('servicesContent.ramp.description'),
        action: () => {
          const email = user?.email;
          const address = this.getCryptoPurchaseAddress();
          if (address === null) return;

          Alert.alert(
            t('servicesContent.ramp.assetDecisionAlert.title'),
            t('servicesContent.ramp.assetDecisionAlert.description'),
            [
              {
                text: t('servicesContent.ramp.assetDecisionAlert.actionNonPlr'),
                onPress: () => this.tryOpenCryptoPurchaseUrl(rampWidgetUrl(address, email)),
              },
              {
                text: t('servicesContent.ramp.assetDecisionAlert.actionPlr'),
                onPress: () => this.tryOpenCryptoPurchaseUrl(rampWidgetUrl(address, email, true)),
              },
            ],
            { cancelable: true },
          );
        },
      });
    }

    if (isWyreEnabled && walletId) {
      buyCryptoServices.push({
        key: 'wyre',
        title: t('servicesContent.wyre.title'),
        body: t('servicesContent.wyre.description'),
        action: () => {
          const address = this.getCryptoPurchaseAddress();
          if (address === null) return;
          this.props.navigation.navigate(SENDWYRE_INPUT, {
            onSubmit: async (values: SendwyreTrxValues) => {
              const url = await wyreWidgetUrl({ ...values, walletId, address }, getApi());
              await this.tryOpenCryptoPurchaseUrl(url);
            },
          });
        },
      });
    }

    if (isAltalixEnabled && isAltalixAvailable && walletId) {
      buyCryptoServices.push({
        key: 'altalix',
        title: t('servicesContent.altalix.title'),
        body: t('servicesContent.altalix.description'),
        action: async () => {
          const address = this.getCryptoPurchaseAddress();
          if (address === null) return;
          this.tryOpenCryptoPurchaseUrl(await altalixWidgetUrl({
            walletId,
            address,
            sellCurrency: 'EUR',
            buyCurrency: 'ETH',

            // The amount is adjustable in the Altalix app, but the link won't work
            // if the initial value is 0
            buyAmount: 0.02,
          }, getApi()));
        },
      });
    }

    return buyCryptoServices;
  }

  getCryptoPurchaseAddress = (): string | null => {
    const { accounts } = this.props;

    const activeAccount = getActiveAccount(accounts);

    if (!activeAccount || !checkIfLegacySmartWalletAccount(activeAccount)) {
      Modal.open(() => (
        <BuyCryptoAccountWarnModal message={ACCOUNT_MSG.SW_ACCOUNT_NOT_ACTIVE} />
      ));
      return null;
    }

    return getAccountAddress(activeAccount);
  }

  tryOpenCryptoPurchaseUrl = async (url: string | null) => {
    if (url) {
      await openInAppBrowser(url)
        .catch(this.showServiceLaunchError);
    } else {
      this.showServiceLaunchError();
    }
  };

  showServiceLaunchError = () => {
    Toast.show({
      message: t('toast.cryptoPurchaseLaunchFailed'),
      emoji: 'hushed',
      supportLink: true,
    });
  }

  renderServicesItem = ({ item }) => {
    const {
      title,
      body,
      action,
      disabled,
      label,
      hidden = false,
    } = item;

    if (hidden) {
      return null;
    }
    return (
      <ListCard
        title={title}
        subtitle={body}
        action={action}
        disabled={disabled}
        label={label}
      />
    );
  }

  render() {
    const services = this.getServices();

    return (
      <ContainerWithHeader
        headerProps={{
          noBack: true,
          rightItems: [{ link: t('button.support'), onPress: () => Intercom.displayMessenger() }],
          leftItems: [{ title: t('servicesContent.title.servicesScreen') }],
        }}
        inset={{ bottom: 'never' }}
        tab
      >
        {onScroll => (
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
  user: { data: user },
  accounts: { data: accounts },
  fiatToCrypto: { isAltalixAvailable },
}: RootReducerState): $Shape<Props> => ({
  user,
  accounts,
  isAltalixAvailable,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loadAltalixInfo: () => dispatch(loadAltalixAvailability()),

  // When using redux-thunk, dispatch does return the result of the inner function.
  // (Although it's meant to be used inside thunks, see:
  // https://github.com/reduxjs/redux-thunk#composition )
  getApi: () => ((dispatch((_, getState, api) => api): $FlowFixMe): SDKWrapper),
});

export default connect(mapStateToProps, mapDispatchToProps)(ServicesScreen);
