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
import { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import { loadAltalixAvailability } from 'actions/fiatToCryptoActions';

// components
import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BuyCryptoAccountWarnModal, { ACCOUNT_MSG } from 'components/BuyCryptoAccountWarnModal';
import Toast from 'components/Toast';

// constants
import {
  EXCHANGE,
  LENDING_CHOOSE_DEPOSIT,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
  SENDWYRE_INPUT,
  RARI_DEPOSIT,
} from 'constants/navigationConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';

// utils
import { getThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { openInAppBrowser } from 'utils/inAppBrowser';
import {
  getActiveAccount,
  getAccountAddress,
  checkIfSmartWalletAccount,
} from 'utils/accounts';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { rampWidgetUrl, wyreWidgetUrl, altalixWidgetUrl } from 'utils/fiatToCrypto';

// selectors
import { isActiveAccountSmartWalletSelector, isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { User } from 'models/User';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { ModalMessage } from 'components/BuyCryptoAccountWarnModal';
import type { SendwyreTrxValues } from 'models/FiatToCryptoProviders';
import type SDKWrapper from 'services/api';

// assets
import PROVIDERS_META from 'assets/exchange/providersMeta.json';

// Config constants, to be overwritten in componentDidMount
let isOffersEngineEnabled = true;
let isAaveEnabled = true;
let isPoolTogetherEnabled = true;
let isPeerToPeerEnabled = true;
let isWyreEnabled = true;
let isRampEnabled = true;
let isSablierEnabled = true;
let isAltalixEnabled = true;
let isRariEnabled = true;

type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  getMetaData: () => void,
  isActiveAccountSmartWallet: boolean,
  isSmartWalletActivated: boolean,
  user: User,
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
  getApi: () => SDKWrapper,
  isAltalixAvailable: null | boolean,
  loadAltalixInfo: () => void,
};

type State = {
  buyCryptoModalMessage: null | ModalMessage,
};

class ServicesScreen extends React.Component<Props, State> {
  state = {
    buyCryptoModalMessage: null,
  };

  componentDidMount() {
    const { isAltalixAvailable, loadAltalixInfo } = this.props;

    /**
     * Retrieve boolean flags for services from Remote Config.
     */
    isOffersEngineEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.OFFERS_ENGINE);
    isAaveEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.AAVE);
    isPoolTogetherEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.POOL_TOGETHER);
    isPeerToPeerEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.PEER_TO_PEER);
    isWyreEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.WYRE);
    isRampEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.RAMP);
    isSablierEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.SABLIER);
    isAltalixEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.ALTALIX);
    isRariEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.RARI);

    if (isAltalixAvailable === null) loadAltalixInfo();
  }

  getServices = () => {
    const {
      navigation,
      theme,
      isActiveAccountSmartWallet,
      isSmartWalletActivated,
    } = this.props;
    const colors = getThemeColors(theme);
    const offersBadge = Array.isArray(PROVIDERS_META) && !!PROVIDERS_META.length ? {
      label: t('servicesContent.exchange.label.exchangeCount', { count: PROVIDERS_META.length }),
      color: colors.primary,
    } : null;

    const SWServiceDisabled = !isActiveAccountSmartWallet || !isSmartWalletActivated;
    let SWServiceLabel;
    if (SWServiceDisabled) {
      SWServiceLabel = !isSmartWalletActivated
        ? t('servicesContent.label.requiresActivation')
        : t('servicesContent.label.forSmartWallet');
    }

    const services = [];
    if (isOffersEngineEnabled) {
      services.push({
        key: 'offersEngine',
        title: t('servicesContent.exchange.title'),
        body: t('servicesContent.exchange.description'),
        action: () => navigation.navigate(EXCHANGE),
        labelBadge: offersBadge,
      });
    }
    services.push(...this.getBuyCryptoServices());
    if (isAaveEnabled) {
      services.push({
        key: 'depositPool',
        title: t('servicesContent.aaveDeposit.title'),
        body: t('servicesContent.aaveDeposit.description'),
        disabled: SWServiceDisabled,
        label: SWServiceLabel,
        action: () => isActiveAccountSmartWallet && navigation.navigate(LENDING_CHOOSE_DEPOSIT),
      });
    }
    if (isPoolTogetherEnabled) {
      services.push({
        key: 'poolTogether',
        title: t('servicesContent.poolTogether.title'),
        body: t('servicesContent.poolTogether.description'),
        hidden: !isActiveAccountSmartWallet,
        action: () => navigation.navigate(POOLTOGETHER_DASHBOARD),
      });
    }
    if (isSablierEnabled) {
      services.push({
        key: 'sablier',
        title: t('servicesContent.sablier.title'),
        body: t('servicesContent.sablier.description'),
        disabled: SWServiceDisabled,
        label: SWServiceLabel,
        action: () => navigation.navigate(SABLIER_STREAMS),
      });
    }
    if (isRariEnabled) {
      services.push({
        key: 'rari',
        title: t('servicesContent.rari.title'),
        body: t('servicesContent.rari.description'),
        disabled: SWServiceDisabled,
        label: SWServiceLabel,
        action: () => navigation.navigate(RARI_DEPOSIT),
      });
    }
    if (isPeerToPeerEnabled) {
      services.push({
        key: 'peerToPeerTrading',
        title: t('servicesContent.peerToPeerTrading.title'),
        body: t('servicesContent.peerToPeerTrading.description'),
        disabled: true,
        label: t('servicesContent.label.soon'),
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
    const { accounts, smartWalletState } = this.props;

    const activeAccount = getActiveAccount(accounts);
    const smartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    if (!smartWalletStatus.hasAccount) {
      this.setState({ buyCryptoModalMessage: ACCOUNT_MSG.NO_SW_ACCOUNT });
      return null;
    }

    if (!activeAccount || !checkIfSmartWalletAccount(activeAccount)) {
      this.setState({ buyCryptoModalMessage: ACCOUNT_MSG.SW_ACCOUNT_NOT_ACTIVE });
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

  onBuyCryptoModalClose = () => {
    this.setState({ buyCryptoModalMessage: null });
  }

  renderServicesItem = ({ item }) => {
    const {
      title,
      body,
      action,
      disabled,
      label,
      labelBadge,
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
        labelBadge={labelBadge}
      />
    );
  }

  render() {
    const services = this.getServices();
    const { buyCryptoModalMessage } = this.state;

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
            <BuyCryptoAccountWarnModal
              navigation={this.props.navigation}
              message={buyCryptoModalMessage}
              onClose={this.onBuyCryptoModalClose}
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
  smartWallet: smartWalletState,
  fiatToCrypto: { isAltalixAvailable },
}: RootReducerState): $Shape<Props> => ({
  user,
  accounts,
  smartWalletState,
  isAltalixAvailable,
});

const structuredSelector = createStructuredSelector({
  isActiveAccountSmartWallet: isActiveAccountSmartWalletSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loadAltalixInfo: () => dispatch(loadAltalixAvailability()),

  // When using redux-thunk, dispatch does return the result of the inner function.
  // (Although it's meant to be used inside thunks, see:
  // https://github.com/reduxjs/redux-thunk#composition )
  getApi: () => ((dispatch((_, getState, api) => api): $FlowFixMe): SDKWrapper),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ServicesScreen));
