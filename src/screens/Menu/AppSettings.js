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
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import {
  setAppThemeAction,
  setPreferredGasTokenAction,
} from 'actions/appSettingsActions';
import { getLanguageFullName } from 'services/localisation/translations';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import Modal from 'components/Modal';

// constants
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';
import { MANAGE_CONNECTED_DEVICES } from 'constants/navigationConstants';

// utils
import { spacing } from 'utils/variables';
import SystemInfoModal from 'components/SystemInfoModal';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import localeConfig from 'configs/localeConfig';
import { addressesEqual } from 'utils/assets';

// selectors
import {
  isGasTokenSupportedSelector,
  isActiveAccountSmartWalletSelector,
  preferredGasTokenSelector,
} from 'selectors/smartWallet';
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import type { LocalisationOptions } from 'models/Translations';
import type { NavigationScreenProp } from 'react-navigation';
import type { ConnectedDevice } from 'models/ConnectedDevice';

// local
import { SettingsSection } from './SettingsSection';
import BaseFiatCurrencyModal from './BaseFiatCurrencyModal';
import LanguageModal from './LanguageModal';
import AnalyticsModal from './AnalyticsModal';

type Props = {
  baseFiatCurrency: ?string,
  themeType: string,
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => void,
  preferredGasToken: ?string,
  isGasTokenSupported: boolean,
  isSmartAccount: boolean,
  accountAssets: Assets,
  accountHistory: Transaction[],
  setPreferredGasToken: (token: string) => void,
  localisation: ?LocalisationOptions,
  navigation: NavigationScreenProp<*>,
  devices: ConnectedDevice[],
  activeDeviceAddress: string,
  sessionLanguageCode: ?string,
};

type State = {
  isAfterRelayerMigration: boolean,
};

class AppSettings extends React.Component<Props, State> {
  state = {
    isAfterRelayerMigration: false,
  };

  getItems = () => {
    const {
      baseFiatCurrency,
      themeType,
      setAppTheme,
      preferredGasToken,
      isGasTokenSupported,
      setPreferredGasToken,
      isSmartAccount,
      localisation,
      navigation,
      devices,
      activeDeviceAddress,
      sessionLanguageCode,
    } = this.props;

    const showRelayerMigration = isSmartAccount && !isGasTokenSupported;

    const hasOtherDevicesLinked = !!devices.length
      && !!devices.filter(({ address }) => !addressesEqual(activeDeviceAddress, address)).length;
    const showGasTokenOption = isSmartAccount && firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.APP_FEES_PAID_WITH_PLR);

    return [
      {
        key: 'language',
        title: t('settingsContent.settingsItem.language.title'),
        onPress: this.openLanguageModal,
        value: getLanguageFullName(localisation?.activeLngCode || sessionLanguageCode || localeConfig.defaultLanguage),
        hidden: !localeConfig.isEnabled && Object.keys(localeConfig.supportedLanguages).length <= 1,
      },
      {
        key: 'localFiatCurrency',
        title: t('settingsContent.settingsItem.fiatCurrency.title'),
        onPress: this.openBaseFiatCurrencyModal,
        value: baseFiatCurrency || defaultFiatCurrency,
      },
      showGasTokenOption && {
        key: 'preferredGasToken',
        title: t('settingsContent.settingsItem.payFeeWithPillar.title'),
        toggle: true,
        value: preferredGasToken === PLR,
        onPress: () => {
          if (showRelayerMigration) {
            this.openRelayerMigrationModal();
            return;
          }
          setPreferredGasToken(preferredGasToken === PLR ? ETH : PLR);
        },
      },
      {
        key: 'darkMode',
        title: t('settingsContent.settingsItem.darkMode.title'),
        toggle: true,
        value: themeType === DARK_THEME,
        onPress: () => setAppTheme(themeType === DARK_THEME ? LIGHT_THEME : DARK_THEME, true),
      },
      {
        key: 'linkedDevices',
        title: t('settingsContent.settingsItem.linkedDevices.title'),
        subtitle: t('settingsContent.settingsItem.linkedDevices.subtitle'),
        onPress: () => navigation.navigate(MANAGE_CONNECTED_DEVICES),
        bulletedLabel: !hasOtherDevicesLinked && {
          label: 'Not set',
        },
      },
      {
        key: 'analytics',
        title: t('settingsContent.settingsItem.analytics.title'),
        onPress: this.openAnalyticsModal,
      },
      {
        key: 'systemInfo',
        title: t('settingsContent.settingsItem.systemInfo.title'),
        onPress: this.openSystemInfoModal,
      },
    ].filter(Boolean);
  };

  openBaseFiatCurrencyModal = () => Modal.open(() => <BaseFiatCurrencyModal />)

  openLanguageModal = () => Modal.open(() => <LanguageModal />)

  openRelayerMigrationModal = () => {
    const { accountAssets, accountHistory } = this.props;

    Modal.open(() => (
      <RelayerMigrationModal
        accountAssets={accountAssets}
        accountHistory={accountHistory}
        onMigrated={() => this.setState({ isAfterRelayerMigration: true })}
      />
    ));
  }

  openAnalyticsModal = () => Modal.open(() => <AnalyticsModal />)

  openSystemInfoModal = () => Modal.open(() => <SystemInfoModal />);

  componentDidUpdate(prevProps: Props) {
    const { isGasTokenSupported, setPreferredGasToken, preferredGasToken } = this.props;
    const gasTokenBecameSupported = prevProps.isGasTokenSupported !== isGasTokenSupported && isGasTokenSupported;

    if (gasTokenBecameSupported && this.state.isAfterRelayerMigration) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isAfterRelayerMigration: false });
      setPreferredGasToken(preferredGasToken === PLR ? ETH : PLR);
    }
  }

  render() {
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('settingsContent.settingsItem.appSettings.title') }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper
          contentContainerStyle={{
            paddingTop: spacing.mediumLarge,
          }}
        >
          <SettingsSection
            sectionItems={this.getItems()}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    data: {
      baseFiatCurrency,
      themeType,
      localisation,
    },
  },
  smartWallet: { connectedAccount: { activeDeviceAddress } },
  connectedDevices: { data: devices },
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  themeType,
  localisation,
  activeDeviceAddress,
  devices,
  sessionLanguageCode,
});

const structuredSelector = createStructuredSelector({
  isGasTokenSupported: isGasTokenSupportedSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  accountAssets: accountAssetsSelector,
  accountHistory: accountHistorySelector,
  preferredGasToken: preferredGasTokenSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => dispatch(
    setAppThemeAction(themeType, isManualThemeSelection),
  ),
  setPreferredGasToken: (token: string) => dispatch(setPreferredGasTokenAction(token)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AppSettings);
