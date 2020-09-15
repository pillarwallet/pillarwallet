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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import { spacing, fontStyles, fontTrackings } from 'utils/variables';
import { supportedFiatCurrencies, defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { BaseText } from 'components/Typography';
import SettingsListItem from 'components/ListItem/SettingsItem';
import Checkbox from 'components/Checkbox';
import SystemInfoModal from 'components/SystemInfoModal';
import RelayerMigrationModal from 'components/RelayerMigrationModal';

import {
  saveBaseFiatCurrencyAction,
  setAppThemeAction,
  saveOptOutTrackingAction,
  setPreferredGasTokenAction,
} from 'actions/appSettingsActions';
import { getDefaultSupportedUserLanguage, getLanguageFullName } from 'services/localisation/translations';
import { changeLanguageAction } from 'actions/localisationActions';

import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { MANAGE_CONNECTED_DEVICES } from 'constants/navigationConstants';

import localeConfig from 'configs/localeConfig';
import { addressesEqual } from 'utils/assets';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import type { LocalisationOptions } from 'models/Translations';
import type { NavigationScreenProp } from 'react-navigation';
import type { ConnectedDevice } from 'models/ConnectedDevice';

import {
  isGasTokenSupportedSelector,
  isActiveAccountSmartWalletSelector,
  preferredGasTokenSelector,
} from 'selectors/smartWallet';
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';
import { SettingsSection } from './SettingsSection';


type Props = {
  baseFiatCurrency: ?string,
  themeType: string,
  optOutTracking: boolean,
  saveBaseFiatCurrency: (currency: string) => void,
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => void,
  saveOptOutTracking: (status: boolean) => void,
  preferredGasToken: ?string,
  isGasTokenSupported: boolean,
  isSmartAccount: boolean,
  accountAssets: Assets,
  accountHistory: Transaction[],
  setPreferredGasToken: (token: string) => void,
  changeLanguage: (languageCode: string) => void,
  localisation: ?LocalisationOptions,
  navigation: NavigationScreenProp<*>,
  devices: ConnectedDevice[],
  activeDeviceAddress: string,
};

type State = {
  visibleModal: ?string,
  showRelayerMigrationModal: boolean,
};

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: ${spacing.medium}px;
`;

const SmallText = styled(BaseText)`
  ${fontStyles.regular};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.medium};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
  margin-bottom: ${spacing.medium}px;
`;


const currencies = supportedFiatCurrencies.map(currency => ({ name: currency, value: currency }));
const CURRENCY = 'currency';
const LANGUAGE = 'language';
const MODAL = {
  SYSTEM_INFO: 'systemInfo',
  BASE_CURRENCY: 'baseCurrency',
  ANALYTICS: 'analytics',
  LANGUAGES: 'languages',
};
const languages = Object.keys(localeConfig.supportedLanguages)
  .map(languageCode => ({ name: localeConfig.supportedLanguages[languageCode], value: languageCode }));

class AppSettings extends React.Component<Props, State> {
  state = {
    visibleModal: null,
    showRelayerMigrationModal: false,
  };

  renderListItem = (
    field: string,
    onSelect: Function,
    currentValue: string,
  ) => ({
    item: { name, value },
  }: Object) => (
    <SettingsListItem
      key={value}
      label={name}
      isSelected={value === currentValue}
      onPress={() => onSelect(value)}
    />
  );

  handleCurrencyUpdate = (value: string) => {
    const { saveBaseFiatCurrency } = this.props;
    saveBaseFiatCurrency(value);
    this.setState({ visibleModal: null });
  };

  handleLanguageUpdate = (value: string) => {
    const { changeLanguage } = this.props;
    changeLanguage(value);
    this.setState({ visibleModal: null });
  };

  handleToggleOptOutTracking = () => {
    const { saveOptOutTracking, optOutTracking } = this.props;
    saveOptOutTracking(!optOutTracking);
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
    } = this.props;

    const showRelayerMigration = isSmartAccount && !isGasTokenSupported;

    const hasOtherDevicesLinked = !!devices.length
      && !!devices.filter(({ address }) => !addressesEqual(activeDeviceAddress, address)).length;

    return [
      {
        key: 'language',
        title: t('settingsContent.settingsItem.language.title'),
        onPress: () => this.setState({ visibleModal: MODAL.LANGUAGES }),
        value: getLanguageFullName(localisation?.activeLngCode || localeConfig.defaultLanguage),
        hidden: !localeConfig.isEnabled
          || !localeConfig.baseUrl
          || Object.keys(localeConfig.supportedLanguages).length <= 1,
      },
      {
        key: 'localFiatCurrency',
        title: t('settingsContent.settingsItem.fiatCurrency.title'),
        onPress: () => this.setState({ visibleModal: MODAL.BASE_CURRENCY }),
        value: baseFiatCurrency || defaultFiatCurrency,
      },
      isSmartAccount &&
      {
        key: 'preferredGasToken',
        title: t('settingsContent.settingsItem.payFeeWithPillar.title'),
        toggle: true,
        value: preferredGasToken === PLR,
        onPress: () => {
          if (showRelayerMigration) {
            this.setState({ showRelayerMigrationModal: true });
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
        key: MODAL.ANALYTICS,
        title: t('settingsContent.settingsItem.analytics.title'),
        onPress: () => this.setState({ visibleModal: MODAL.ANALYTICS }),
      },
      {
        key: MODAL.SYSTEM_INFO,
        title: t('settingsContent.settingsItem.systemInfo.title'),
        onPress: () => this.setState({ visibleModal: MODAL.SYSTEM_INFO }),
      },
    ].filter(Boolean);
  };

  handleOptionListItemRender = (item, type) => {
    const { baseFiatCurrency, localisation } = this.props;
    switch (type) {
      case CURRENCY:
        return this.renderListItem(CURRENCY, this.handleCurrencyUpdate, baseFiatCurrency || defaultFiatCurrency)(item);
      case LANGUAGE:
        const currentLanguage = localisation?.activeLngCode || getDefaultSupportedUserLanguage();
        return this.renderListItem(LANGUAGE, this.handleLanguageUpdate, currentLanguage)(item);
      default:
        return null;
    }
  };

  componentDidUpdate(prevProps: Props) {
    const { isGasTokenSupported, setPreferredGasToken, preferredGasToken } = this.props;
    const { showRelayerMigrationModal } = this.state;
    if (prevProps.isGasTokenSupported !== isGasTokenSupported && isGasTokenSupported && showRelayerMigrationModal) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ showRelayerMigrationModal: false });
      setPreferredGasToken(preferredGasToken === PLR ? ETH : PLR);
    }
  }

  render() {
    const {
      optOutTracking,
      isSmartAccount,
      isGasTokenSupported,
      accountAssets,
      accountHistory,
    } = this.props;
    const { visibleModal, showRelayerMigrationModal } = this.state;

    const showRelayerMigration = isSmartAccount && !isGasTokenSupported;

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

        {/* BASE CURRENCY */}
        <SlideModal
          isVisible={visibleModal === MODAL.BASE_CURRENCY}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          title={t('settingsContent.settingsItem.fiatCurrency.screenTitle')}
          insetTop
        >
          <FlatList
            data={currencies}
            renderItem={(item) => this.handleOptionListItemRender(item, CURRENCY)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>

        {/* ANALYTICS */}
        <SlideModal
          isVisible={visibleModal === MODAL.ANALYTICS}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          avoidKeyboard
          title={t('settingsContent.settingsItem.analytics.title')}
          insetTop
        >
          <Wrapper regularPadding flex={1}>
            <StyledWrapper>
              <Checkbox
                checked={!optOutTracking}
                onPress={() => this.handleToggleOptOutTracking()}
                wrapperStyle={{ marginBottom: spacing.large }}
              >
                <CheckboxText>
                  {t('settingsContent.settingsItem.analytics.paragraph.agreeSharingInfo')}
                </CheckboxText>
              </Checkbox>
              <SmallText>
                {t('settingsContent.settingsItem.analytics.paragraph.legal')}
              </SmallText>
            </StyledWrapper>
          </Wrapper>
        </SlideModal>

        {/* SYSTEM INFO MODAL */}
        <SlideModal
          isVisible={visibleModal === MODAL.SYSTEM_INFO}
          fullScreen
          showHeader
          title={t('settingsContent.settingsItem.systemInfo.title')}
          onModalHide={() => this.setState({ visibleModal: null })}
          insetTop
        >
          <SystemInfoModal headerOnClose={() => this.setState({ visibleModal: null })} />
        </SlideModal>

        {/* RELAYER GAS FEE ACTIVATION MODAL */}
        {showRelayerMigration &&
          <RelayerMigrationModal
            isVisible={showRelayerMigrationModal}
            onModalHide={() => this.setState({ showRelayerMigrationModal: false })}
            accountAssets={accountAssets}
            accountHistory={accountHistory}
          />
        }

        {/* LANGUAGES */}
        <SlideModal
          isVisible={visibleModal === MODAL.LANGUAGES}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          title={t('settingsContent.settingsItem.language.screenTitle')}
          insetTop
        >
          <FlatList
            data={languages}
            renderItem={(item) => this.handleOptionListItemRender(item, LANGUAGE)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>

      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    data: {
      baseFiatCurrency,
      themeType,
      optOutTracking = false,
      localisation,
    },
  },
  smartWallet: { connectedAccount: { activeDeviceAddress } },
  connectedDevices: { data: devices },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  themeType,
  optOutTracking,
  localisation,
  activeDeviceAddress,
  devices,
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
  saveBaseFiatCurrency: (currency: string) => dispatch(saveBaseFiatCurrencyAction(currency)),
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => dispatch(
    setAppThemeAction(themeType, isManualThemeSelection),
  ),
  saveOptOutTracking: (status: boolean) => dispatch(saveOptOutTrackingAction(status)),
  setPreferredGasToken: (token: string) => dispatch(setPreferredGasTokenAction(token)),
  changeLanguage: (languageCode: string) => dispatch(changeLanguageAction(languageCode)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AppSettings);
