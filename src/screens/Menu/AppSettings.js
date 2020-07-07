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

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import { spacing, fontStyles, fontTrackings } from 'utils/variables';
import { supportedFiatCurrencies, defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { Paragraph, BaseText } from 'components/Typography';
import SettingsListItem from 'components/ListItem/SettingsItem';
import Button from 'components/Button';
import Checkbox from 'components/Checkbox';
import SystemInfoModal from 'components/SystemInfoModal';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import {
  saveBaseFiatCurrencyAction,
  setAppThemeAction,
  setUserJoinedBetaAction,
  saveOptOutTrackingAction,
  setPreferredGasTokenAction,
} from 'actions/appSettingsActions';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
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
  userJoinedBeta: boolean,
  optOutTracking: boolean,
  saveBaseFiatCurrency: (currency: string) => void,
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => void,
  setUserJoinedBeta: (status: boolean) => void,
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
  leaveBetaPressed: boolean,
  joinBetaPressed: boolean,
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

class AppSettings extends React.Component<Props, State> {
  state = {
    visibleModal: null,
    leaveBetaPressed: false,
    joinBetaPressed: false,
    showRelayerMigrationModal: false,
  }

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
      onPress={() => onSelect({ [field]: value })}
    />
  );

  handleCurrencyUpdate = ({ currency }: Object) => {
    const { saveBaseFiatCurrency } = this.props;
    saveBaseFiatCurrency(currency);
    this.setState({ visibleModal: null });
  };

  handleJoinBetaModalClose = () => {
    // this is needed so that toast message can be shown in settings instead of slide modal that closes
    if (this.state.joinBetaPressed) {
      this.setState({ joinBetaPressed: false });
      this.props.setUserJoinedBeta(true);
    }
  };


  handleLeaveBetaModalClose = () => {
    // this is needed so that toast message can be shown in settings instead of slide modal that closes
    if (this.state.leaveBetaPressed) {
      this.setState({ leaveBetaPressed: false });
      this.props.setUserJoinedBeta(false);
    }
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
      userJoinedBeta,
      preferredGasToken,
      isGasTokenSupported,
      setPreferredGasToken,
      isSmartAccount,
    } = this.props;

    const showRelayerMigration = isSmartAccount && !isGasTokenSupported;

    return [
      {
        key: 'localFiatCurrency',
        title: 'Local fiat currency',
        onPress: () => this.setState({ visibleModal: 'baseCurrency' }),
        value: baseFiatCurrency || defaultFiatCurrency,
      },
      isSmartAccount &&
      {
        key: 'preferredGasToken',
        title: 'Pay fees with PLR',
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
        title: 'Dark mode',
        toggle: true,
        value: themeType === DARK_THEME,
        onPress: () => setAppTheme(themeType === DARK_THEME ? LIGHT_THEME : DARK_THEME, true),
      },
      {
        key: 'joinBeta',
        title: userJoinedBeta ? 'Leave the Early Access program' : 'Opt in to Early Access',
        onPress: () => userJoinedBeta
          ? this.setState({ visibleModal: 'leaveBeta' })
          : this.setState({ visibleModal: 'joinBeta' }),
      },
      {
        key: 'analytics',
        title: 'Usage analytics',
        onPress: () => this.setState({ visibleModal: 'analytics' }),
      },
      {
        key: 'systemInfo',
        title: 'System Info',
        onPress: () => this.setState({ visibleModal: 'systemInfo' }),
      },
    ].filter(Boolean);
  }

  renderCurrencyListItem = (item) => {
    const { baseFiatCurrency } = this.props;
    return this.renderListItem('currency', this.handleCurrencyUpdate, baseFiatCurrency || defaultFiatCurrency)(item);
  }

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
        headerProps={{ centerItems: [{ title: 'App settings' }] }}
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
          isVisible={visibleModal === 'baseCurrency'}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          title="Choose your base currency"
          insetTop
        >
          <FlatList
            data={currencies}
            renderItem={this.renderCurrencyListItem}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>

        {/* JOIN BETA */}
        <SlideModal
          isVisible={visibleModal === 'joinBeta'}
          fullScreen
          showHeader
          onModalHidden={this.handleJoinBetaModalClose}
          avoidKeyboard
          title="Early Access"
          onModalHide={() => this.setState({ visibleModal: null })}
          insetTop
        >
          <StyledWrapper regularPadding flex={1}>
            <Paragraph small>
              By choosing this you will be added to our Analytics data collection.
              Through this, Pillar will collect your username in order to enable new features and monitor your new
              wallet experience for any bugs and/or crashes.
              You can choose to leave the Early Access program at any time
              via the &quot;System&quot; under Settings.
            </Paragraph>
            <Button
              title="Opt in"
              onPress={() => this.setState({ visibleModal: null, joinBetaPressed: true })}
              style={{ marginBottom: 13 }}
            />
          </StyledWrapper>
        </SlideModal>

        {/* LEAVE BETA */}
        <SlideModal
          isVisible={visibleModal === 'leaveBeta'}
          fullScreen
          showHeader
          onModalHidden={this.handleLeaveBetaModalClose}
          avoidKeyboard
          title="Leaving Early Access program"
          onModalHide={() => this.setState({ visibleModal: null })}
          insetTop
        >
          <StyledWrapper regularPadding flex={1}>
            <Paragraph small>
              By confirming, you will leave the Early Access program.
            </Paragraph>
            <Paragraph small>
              If you wish to re-gain early access, you will need to apply again.
            </Paragraph>
            <Button
              title="Leave Program"
              onPress={() => { this.setState({ visibleModal: null, leaveBetaPressed: true }); }}
              style={{ marginBottom: 13 }}
            />
          </StyledWrapper>
        </SlideModal>

        {/* ANALYTICS */}
        <SlideModal
          isVisible={visibleModal === 'analytics'}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          avoidKeyboard
          title="Usage analytics"
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
                  I&apos;m happy to share anonymous application usage statistics
                </CheckboxText>
              </Checkbox>
              <SmallText>
                By sharing application usage statistics you are helping Pillar build a better wallet.
              </SmallText>
              <SmallText>
                Usage statistics do not include any personal information from you or your contacts.
              </SmallText>
            </StyledWrapper>
          </Wrapper>
        </SlideModal>

        {/* SYSTEM INFO MODAL */}
        <SlideModal
          isVisible={visibleModal === 'systemInfo'}
          fullScreen
          showHeader
          title="System info"
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

      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    data: {
      baseFiatCurrency,
      themeType,
      userJoinedBeta = false,
      optOutTracking = false,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  themeType,
  userJoinedBeta,
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
  saveBaseFiatCurrency: (currency: string) => dispatch(saveBaseFiatCurrencyAction(currency)),
  setAppTheme: (themeType: string, isManualThemeSelection?: boolean) => dispatch(
    setAppThemeAction(themeType, isManualThemeSelection),
  ),
  setUserJoinedBeta: (status: boolean) => dispatch(setUserJoinedBetaAction(status)),
  saveOptOutTracking: (status: boolean) => dispatch(saveOptOutTrackingAction(status)),
  setPreferredGasToken: (token: string) => dispatch(setPreferredGasTokenAction(token)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AppSettings);
