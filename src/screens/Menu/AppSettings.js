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
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import {
  setAppThemeAction,
  saveOptOutTrackingAction,
  setPreferredGasTokenAction,
} from 'actions/appSettingsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import Modal from 'components/Modal';

// constants
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';

// utils
import { spacing, fontStyles, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Checkbox from 'components/Checkbox';
import SystemInfoModal from 'components/SystemInfoModal';
import RelayerMigrationModal from 'components/RelayerMigrationModal';

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

// local
import { SettingsSection } from './SettingsSection';
import BaseFiatCurrencyModal from './BaseFiatCurrencyModal';

type Props = {
  baseFiatCurrency: ?string,
  themeType: string,
  optOutTracking: boolean,
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => void,
  saveOptOutTracking: (status: boolean) => void,
  preferredGasToken: ?string,
  isGasTokenSupported: boolean,
  isSmartAccount: boolean,
  accountAssets: Assets,
  accountHistory: Transaction[],
  setPreferredGasToken: (token: string) => void,
};

type State = {
  visibleModal: ?string,
  isAfterRelayerMigration: boolean,
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

const MODAL = {
  SYSTEM_INFO: 'systemInfo',
  ANALYTICS: 'analytics',
};

class AppSettings extends React.Component<Props, State> {
  state = {
    visibleModal: null,
    isAfterRelayerMigration: false,
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
    } = this.props;

    const showRelayerMigration = isSmartAccount && !isGasTokenSupported;

    const showGasTokenOption = isSmartAccount && firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.APP_FEES_PAID_WITH_PLR);

    return [
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

  openBaseFiatCurrencyModal = () => Modal.open(() => <BaseFiatCurrencyModal />)

  openRelayerMigrationModal = () => {
    const { accountAssets, accountHistory } = this.props;

    Modal.open(() => (
      <RelayerMigrationModal
        accountAssets={accountAssets}
        accountHistory={accountHistory}
        onMigrated={this.setState({ isAfterRelayerMigration: true })}
      />
    ));
  }

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
    const { optOutTracking } = this.props;
    const { visibleModal } = this.state;

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
    },
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  themeType,
  optOutTracking,
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
  saveOptOutTracking: (status: boolean) => dispatch(saveOptOutTrackingAction(status)),
  setPreferredGasToken: (token: string) => dispatch(setPreferredGasTokenAction(token)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AppSettings);
