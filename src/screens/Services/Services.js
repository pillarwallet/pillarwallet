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
import { connect } from 'react-redux';
import Intercom from 'react-native-intercom';
import { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import querystring from 'querystring';
import { RAMPNETWORK_API_KEY } from 'react-native-dotenv';
import { getEnv } from 'configs/envConfig';

// actions
import { getMetaDataAction } from 'actions/exchangeActions';

// components
import { ListCard } from 'components/ListItem/ListCard';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BuyCryptoAccountWarnModal, { ACCOUNT_MSG } from 'components/BuyCryptoAccountWarnModal';

// constants
import { EXCHANGE, LENDING_CHOOSE_DEPOSIT, POOLTOGETHER_DASHBOARD } from 'constants/navigationConstants';
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

// selectors
import { isActiveAccountSmartWalletSelector, isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Theme } from 'models/Theme';
import type { ProvidersMeta } from 'models/Offer';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { User } from 'models/User';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { ModalMessage } from 'components/BuyCryptoAccountWarnModal';


// Config constants, to be overwritten in componentDidMount
let isOffersEngineEnabled = true;
let isAaveEnabled = true;
let isPoolTogetherEnabled = true;
let isPeerToPeerEnabled = true;
let isWyreEnabled = true;
let isRampEnabled = true;

type Props = {
  theme: Theme,
  providersMeta: ProvidersMeta,
  navigation: NavigationScreenProp<*>,
  getMetaData: () => void,
  isActiveAccountSmartWallet: boolean,
  isSmartWalletActivated: boolean,
  user: User,
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
};

type State = {
  buyCryptoModalMessage: null | ModalMessage,
};

class ServicesScreen extends React.Component<Props, State> {
  state = {
    buyCryptoModalMessage: null,
  };

  componentDidMount() {
    const { getMetaData, providersMeta } = this.props;
    if (!Array.isArray(providersMeta) || !providersMeta?.length) {
      getMetaData();
    }

    /**
     * Retrieve boolean flags for services from Remote Config.
     */
    isOffersEngineEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.OFFERS_ENGINE);
    isAaveEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.AAVE);
    isPoolTogetherEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.POOL_TOGETHER);
    isPeerToPeerEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.PEER_TO_PEER);
    isWyreEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.WYRE);
    isRampEnabled = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.RAMP);
  }

  getServices = () => {
    const {
      navigation,
      theme,
      providersMeta,
      isActiveAccountSmartWallet,
      isSmartWalletActivated,
    } = this.props;
    const colors = getThemeColors(theme);
    const offersBadge = Array.isArray(providersMeta) && !!providersMeta.length ? {
      label: `${providersMeta.length} exchanges`,
      color: colors.primary,
    } : null;

    const aaveServiceDisabled = !isActiveAccountSmartWallet || !isSmartWalletActivated;
    let aaveServiceLabel;
    if (aaveServiceDisabled) {
      aaveServiceLabel = !isSmartWalletActivated ? 'Requires activation' : 'For Smart Wallet';
    }

    const services = [];
    if (isOffersEngineEnabled) {
      services.push({
        key: 'offersEngine',
        title: 'Offers engine',
        body: 'Aggregated offers from many decentralized exchanges and token swap services',
        action: () => navigation.navigate(EXCHANGE),
        labelBadge: offersBadge,
      });
    }
    services.push(...this.getBuyCryptoServices());
    if (isAaveEnabled) {
      services.push({
        key: 'depositPool',
        title: 'AAVE Deposit',
        body: 'Deposit crypto and earn interest in real-time',
        disabled: aaveServiceDisabled,
        label: aaveServiceLabel,
        action: () => isActiveAccountSmartWallet && navigation.navigate(LENDING_CHOOSE_DEPOSIT),
      });
    }
    if (isPoolTogetherEnabled) {
      services.push({
        key: 'poolTogether',
        title: 'Pool Together savings game',
        body: 'Deposit DAI/USDC into the pool to get tickets. Each ticket is a chance to win weekly/daily prizes!',
        hidden: !isActiveAccountSmartWallet,
        action: () => navigation.navigate(POOLTOGETHER_DASHBOARD),
      });
    }
    if (isPeerToPeerEnabled) {
      services.push({
        key: 'peerToPeerTrading',
        title: 'Peer-to-peer trading',
        body: 'Swap tokens directly with others. Safe, secure, anonymous',
        disabled: true,
        label: 'soon',
      });
    }
    return services;
  };

  getBuyCryptoServices = () => {
    const buyCryptoServices = [];

    if (isRampEnabled) {
      buyCryptoServices.push({
        key: 'ramp',
        title: 'Buy with Ramp.Network (EU)',
        body: 'Buy Now',
        action: () => {
          this.handleBuyCryptoAction(userAddress => {
            const { user: { email = null } } = this.props;

            const params = {
              hostApiKey: RAMPNETWORK_API_KEY,
              userAddress,
              ...(email === null ? {} : { userEmailAddress: email }),
            };

            return `${getEnv('RAMPNETWORK_WIDGET_URL')}?${querystring.stringify(params)}`;
          });
        },
      });
    }

    if (isWyreEnabled) {
      buyCryptoServices.push({
        key: 'wyre',
        title: 'Buy with Wyre (Non-EU)',
        body: 'Buy Now',
        action: () => {
          this.handleBuyCryptoAction(address => `${getEnv('SENDWYRE_WIDGET_URL')}?${querystring.stringify({
            accountId: getEnv('SENDWYRE_ACCOUNT_ID'),
            dest: `ethereum:${address}`,
            redirectUrl: getEnv('SENDWYRE_RETURN_URL'),
          })}`);
        },
      });
    }

    return buyCryptoServices;
  }

  handleBuyCryptoAction = (getUrlWithAddress: string => string) => {
    const { accounts, smartWalletState } = this.props;

    const activeAccount = getActiveAccount(accounts);
    const smartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    if (!smartWalletStatus.hasAccount) {
      this.setState({ buyCryptoModalMessage: ACCOUNT_MSG.NO_SW_ACCOUNT });
      return;
    }

    if (!activeAccount || !checkIfSmartWalletAccount(activeAccount)) {
      this.setState({ buyCryptoModalMessage: ACCOUNT_MSG.SW_ACCOUNT_NOT_ACTIVE });
      return;
    }

    const address: string = getAccountAddress(activeAccount);
    const url = getUrlWithAddress(address);
    openInAppBrowser(url);
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
          rightItems: [{ link: 'Support', onPress: () => Intercom.displayMessenger() }],
          leftItems: [{ title: 'Services' }],
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
  exchange: { providersMeta },
  user: { data: user },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  providersMeta,
  user,
  accounts,
  smartWalletState,
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
  getMetaData: () => dispatch(getMetaDataAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ServicesScreen));
