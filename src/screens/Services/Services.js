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
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { ListCard } from 'components/legacy/ListItem/ListCard';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';

// constants
import { LIQUIDITY_POOLS } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { spacing } from 'utils/variables';
import { getActiveAccount, isArchanovaAccount } from 'utils/accounts';

// selectors
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';
import { emailSupport } from 'services/emailSupport';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';

// Config constants, to be overwritten in componentDidMount
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

    return archanovaSupportedServices;
  };

  getServices = (): Service[] => {
    const { accounts } = this.props;

    // services are left for archanova only and will be decommissioned later
    const services = isArchanovaAccount(getActiveAccount(accounts)) ? this.getArchanovaSupportedServices() : [];

    return services;
  };

  support = async () => {
    const { accounts } = this.props;

    await emailSupport(accounts);
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
          rightItems: [{ link: t('button.support'), onPress: this.support }],
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
