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
import { Keyboard, View, ScrollView, FlatList, Alert } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import * as Keychain from 'react-native-keychain';
import Intercom from 'react-native-intercom';
import type { NavigationScreenProp } from 'react-navigation';
import get from 'lodash.get';
import { Appearance } from 'react-native-appearance';

// actions
import {
  saveBaseFiatCurrencyAction,
  changeUseBiometricsAction,
  saveOptOutTrackingAction,
  setUserJoinedBetaAction,
  changeAppThemeAction,
} from 'actions/appSettingsActions';
import { lockScreenAction, logoutAction, resetIncorrectPasswordAction } from 'actions/authActions';
import { cleanSmartWalletAccountsAction } from 'actions/smartWalletActions';

// components
import { Wrapper } from 'components/Layout';
import { BaseText, MediumText, Paragraph } from 'components/Typography';
import Toast from 'components/Toast';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import ReferralCodeModal from 'screens/Profile/ReferralCodeModal';
import EditProfile from 'screens/Profile/EditProfile';
import SystemInfoModal from 'components/SystemInfoModal';
import SettingsListItem from 'components/ListItem/SettingsItem';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';

// services
import Storage from 'services/storage';
import ChatService from 'services/chat';

// constants
import {
  CONFIRM_CLAIM,
  CHANGE_PIN_FLOW,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  REVEAL_BACKUP_PHRASE,
  RECOVERY_PORTAL_SETUP_INTRO,
  MANAGE_CONNECTED_DEVICES,
} from 'constants/navigationConstants';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import { DARK_THEME, LIGHT_THEME, DARK_PREFERENCE, NO_THEME_PREFERENCE } from 'constants/appSettingsConstants';

// utils
import { isProdEnv } from 'utils/environment';
import { fontTrackings, spacing, fontStyles } from 'utils/variables';
import { userHasSmartWallet } from 'utils/smartWallet';
import { getBiometryType } from 'utils/settings';
import { getThemeColors } from 'utils/themes';

// models
import type { BackupStatus } from 'reducers/walletReducer';
import type { Accounts } from 'models/Account';
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// partials
import { SettingsSection } from './SettingsSection';

type State = {
  visibleModal: ?string,
  supportedBiometryType: string,
  joinBetaPressed: boolean,
  leaveBetaPressed: boolean,
  setBiometrics: ?{
    enabled: boolean,
    privateKey?: string,
  },
  scrollToSection: string,
};

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  intercomNotificationsCount: number,
  cleanSmartWalletAccounts: () => void,
  changeUseBiometrics: (enabled: boolean, privateKey?: string) => void,
  resetIncorrectPassword: () => void,
  saveBaseFiatCurrency: (currency: string) => void,
  baseFiatCurrency: ?string,
  smartWalletFeatureEnabled: boolean,
  saveOptOutTracking: (status: boolean) => void,
  optOutTracking: boolean,
  setUserJoinedBeta: (status: boolean) => void,
  userJoinedBeta: boolean,
  backupStatus: BackupStatus,
  lockScreen: () => void,
  logoutUser: () => void,
  accounts: Accounts,
  theme: Theme,
  themeType: string,
  isSetAsSystemPrefTheme: boolean,
  changeAppTheme: (themeType: string, shouldSetAsPref: boolean) => void,
}

const storage = Storage.getInstance('db');
const chat = new ChatService();

const SYSTEM_DEFAULT_THEME = 'system_default_theme';

const getUserFriendlyThemeName = (currentTheme) => {
  if (currentTheme === DARK_THEME) {
    return 'Dark';
  } else if (currentTheme === SYSTEM_DEFAULT_THEME) {
    return 'System default';
  }
  return 'Light';
};

const getThemeTypeByPreference = (preference) => {
  if (preference === DARK_PREFERENCE) return DARK_THEME;
  return LIGHT_THEME;
};

export const KEY_SECTION = 'KEY_SECTION';

const SettingsModalTitle = styled(MediumText)`
  ${fontStyles.big};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
`;

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: ${spacing.medium}px;
`;

const CheckboxText = styled(BaseText)`
  ${fontStyles.medium};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
  margin-bottom: ${spacing.medium}px;
`;

const SmallText = styled(BaseText)`
  ${fontStyles.regular};
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
`;

const formSecurityItems = (that, biometryType) => {
  const { navigation, useBiometrics } = that.props;
  return [
    {
      key: 'changePin',
      title: 'Change PIN',
      onPress: () => navigation.navigate(CHANGE_PIN_FLOW),
    },
    {
      key: 'biometricLogin',
      title: biometryType,
      onPress: () => that.setState({ visibleModal: 'checkPin' }),
      toggle: true,
      value: useBiometrics,
      hidden: !biometryType,
    },
  ];
};

const formSupportItems = (that) => {
  const { intercomNotificationsCount } = that.props;
  return [
    {
      key: 'support',
      title: 'Chat with support',
      notificationsCount: intercomNotificationsCount,
      onPress: () => Intercom.displayMessenger(),
    },
    {
      key: 'knowledgebase',
      title: 'Knowledge base',
      onPress: () => Intercom.displayHelpCenter(),
    },
  ];
};

const formDebbugItems = (that) => {
  const debugItems = [];

  if (__DEV__) {
    debugItems.push({
      key: 'clearStorage',
      title: 'Clear Local Storage',
      onPress: that.clearLocalStorage,
    });
  }
  return debugItems;
};

const formLegalItems = (that) => {
  return [
    {
      key: 'termsOfUse',
      title: 'Terms of Use',
      onPress: () => that.setState({ visibleModal: 'termsOfService' }),
    },
    {
      key: 'privacyPolicy',
      title: 'Privacy Policy',
      onPress: () => that.setState({ visibleModal: 'privacyPolicy' }),
    },
  ];
};

const formSystemItems = (that) => {
  const { userJoinedBeta } = that.props;
  return [
    {
      key: 'joinBeta',
      title: userJoinedBeta ? 'Leave the Smart Wallet Early Access program' : 'Opt in to Smart Wallet Early Access',
      onPress: () => userJoinedBeta
        ? that.setState({ visibleModal: 'leaveBeta' })
        : that.setState({ visibleModal: 'joinBeta' }),
    },
    {
      key: 'systemInfo',
      title: 'System Info',
      onPress: () => that.setState({ visibleModal: 'systemInfo' }),
    },
    {
      key: 'analytics',
      title: 'Usage analytics',
      onPress: () => that.setState({ visibleModal: 'analytics' }),
    },
  ];
};

const formSmartWalletDevItems = (that) => {
  const { cleanSmartWalletAccounts } = that.props;
  return [
    {
      key: 'clearSmartAccounts',
      title: 'Clear Smart Accounts',
      onPress: cleanSmartWalletAccounts,
    },
  ];
};

const formReferralItems = (that) => {
  return [
    {
      key: 'referralCode',
      title: 'Invite friends',
      onPress: () => that.toggleSlideModalOpen('referralCode'),
    },
    {
      key: 'claimTokens',
      title: 'Get PLR\'s tokens',
      onPress: () => that.toggleSlideModalOpen('claimTokens'),
    },
  ];
};

const formCurrencyItems = (that) => {
  const { baseFiatCurrency } = that.props;
  return [
    {
      key: 'baseCurrency',
      title: 'Base currency',
      value: baseFiatCurrency || defaultFiatCurrency,
      onPress: () => that.setState({ visibleModal: 'baseCurrency' }),
    },
  ];
};

const formThemeItems = (that) => {
  const { themeType: currentTheme, isSetAsSystemPrefTheme } = that.props;
  const themeName = isSetAsSystemPrefTheme ? 'System default' : getUserFriendlyThemeName(currentTheme);
  return [
    {
      key: 'theme',
      title: 'Theme',
      value: themeName,
      onPress: () => that.setState({ visibleModal: 'theme' }),
    },
  ];
};

const formKeyItems = (that) => {
  const { backupStatus } = that.props;
  const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
  return [
    {
      key: 'backupPhrase',
      title: 'Backup phase',
      body: 'Secure your wallet from loss',
      onPress: that.navigateToBackup,
      label: isBackedUp ? '' : 'Not finished',
      minHeight: 80,
    },
  ];
};

const formSmartWalletItems = (that) => {
  return [
    {
      key: 'recoveryPortal',
      title: 'Recovery Portal',
      body: 'Manage recovery devices',
      onPress: that.navigateToRecoveryPortal,
      minHeight: 96,
    },
    {
      key: 'connectedDevices',
      title: 'Manage connected device',
      body: 'Manage this user on different devices simultaneously',
      onPress: that.navigateToConnectedDevices,
      minHeight: 96,
    },
  ];
};

const formMiscItems = (that, colors) => {
  return [
    {
      key: 'closeAndLock',
      title: 'Close and Lock Wallet',
      body: 'Manage this user on different devices simultaneously',
      onPress: that.lockWallet,
      minHeight: 96,
    },
    {
      key: 'deleteWallet',
      title: 'Delete wallet',
      body: 'Wipe all data on this device',
      onPress: that.deleteWallet,
      minHeight: 96,
      titleStyle: { color: colors.negative },
    },
  ];
};

const codeFormFields = [{
  label: 'Code',
  name: 'code',
  type: 'code',
  config: {
    placeholder: 'username',
    autoCapitalize: 'none',
    error: 'Please enter valid code',
  },
}];

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency, value: currency }));
const themesToSelect = [
  {
    name: getUserFriendlyThemeName(LIGHT_THEME),
    value: LIGHT_THEME,
  },
  {
    name: getUserFriendlyThemeName(DARK_THEME),
    value: DARK_THEME,
  },
];

class Settings extends React.Component<Props, State> {
  scrollView: ScrollView;

  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;
    const visibleModal = navigation.getParam('visibleModal', null);
    this.state = {
      visibleModal,
      supportedBiometryType: '',
      joinBetaPressed: false,
      leaveBetaPressed: false,
      setBiometrics: null,
      scrollToSection: '',
    };
  }

  componentDidMount() {
    const { navigation } = this.props;
    Keychain.getSupportedBiometryType()
      .then(biometryType => {
        // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
        // and getBiometryType has default string value
        this.setState({ supportedBiometryType: biometryType ? getBiometryType(biometryType) : '' });
      })
      .catch(() => null);
    const scrollTo = navigation.getParam('scrollTo');
    if (scrollTo) this.setSectionToScrollTo(scrollTo);
    const defaultPreference = Appearance.getColorScheme();
    if (defaultPreference !== NO_THEME_PREFERENCE
      && !themesToSelect.some(({ value }) => value === SYSTEM_DEFAULT_THEME)) {
      themesToSelect.push({
        name: getUserFriendlyThemeName(SYSTEM_DEFAULT_THEME),
        value: SYSTEM_DEFAULT_THEME,
      });
    }
  }

  clearLocalStorage() {
    storage.removeAll();
    chat.client.resetAccount().catch(() => null);
    Toast.show({ title: 'Success', type: 'success', message: 'Local storage was cleared' });
  }

  setSectionToScrollTo = (sectionKey: string) => {
    this.setState({ scrollToSection: sectionKey });
  };

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({ visibleModal });
  };

  handleChangeUseBiometrics = (enabled: boolean, privateKey?: string) => {
    this.setState({
      visibleModal: null,
      setBiometrics: {
        enabled,
        privateKey,
      },
    });
  };

  handleBiometricsCheckPinModalClose = () => {
    const { resetIncorrectPassword, changeUseBiometrics } = this.props;
    const { setBiometrics } = this.state;
    if (!setBiometrics) return;
    const { enabled, privateKey } = setBiometrics;
    this.setState({ setBiometrics: null });
    resetIncorrectPassword();
    changeUseBiometrics(enabled, privateKey);
  };

  handleCodeClaim = (field: Object) => {
    const { navigation } = this.props;
    Keyboard.dismiss();
    this.toggleSlideModalOpen(null);
    navigation.navigate(CONFIRM_CLAIM, { code: field.code });
  };

  handleCurrencyUpdate = ({ currency }: Object) => {
    const { saveBaseFiatCurrency } = this.props;
    saveBaseFiatCurrency(currency);
    this.toggleSlideModalOpen(null);
  };

  handleThemeUpdate = ({ theme }: Object) => {
    const setAsPref = theme === SYSTEM_DEFAULT_THEME;
    const themeToSet = theme === SYSTEM_DEFAULT_THEME ? getThemeTypeByPreference(Appearance.getColorScheme()) : theme;

    const { changeAppTheme } = this.props;
    changeAppTheme(themeToSet, setAsPref);
    this.toggleSlideModalOpen(null);
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

  // navigateToContactInfo = () => {
  //   requestAnimationFrame(() => {
  //     const { navigation } = this.props;
  //     navigation.navigate(CONTACT_INFO);
  //   });
  // }

  navigateToRecoveryPortal = () => {
    const { navigation } = this.props;
    navigation.navigate(RECOVERY_PORTAL_SETUP_INTRO);
  };

  navigateToConnectedDevices = () => {
    const { navigation } = this.props;
    navigation.navigate(MANAGE_CONNECTED_DEVICES);
  };

  navigateToBackup = () => {
    const { navigation, backupStatus } = this.props;
    const {
      isImported,
      isBackedUp,
    } = backupStatus;
    const isWalletBackedUp = isImported || isBackedUp;
    if (!isWalletBackedUp) {
      // DO BACKUP
      navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, { backupViaSettings: true });
    } else {
      navigation.navigate(REVEAL_BACKUP_PHRASE);
    }
  };

  lockWallet = () => {
    const { lockScreen } = this.props;
    lockScreen();
  };

  deleteWallet = () => {
    const { logoutUser } = this.props;
    Alert.alert(
      'Are you sure?',
      'This action will delete the wallet from this device. ' +
      'If you wish to recover, you can re-import that wallet using your backup phrase.',
      [
        { text: 'Cancel' },
        { text: 'Delete', onPress: logoutUser },
      ],
    );
  };

  renderListItem = (field: string, onSelect: Function, currentValue: string) => ({ item: { name, value } }: Object) => {
    return (
      <SettingsListItem
        key={value}
        label={name}
        isSelected={value === currentValue}
        onPress={() => onSelect({ [field]: value })}
      />
    );
  };

  handleToggleOptOutTracking = () => {
    const { saveOptOutTracking, optOutTracking } = this.props;

    saveOptOutTracking(!optOutTracking);
  };

  render() {
    const {
      user,
      useBiometrics,
      smartWalletFeatureEnabled,
      optOutTracking,
      accounts,
      theme,
      baseFiatCurrency,
      themeType,
      isSetAsSystemPrefTheme,
    } = this.props;

    const {
      visibleModal,
      supportedBiometryType,
      scrollToSection,
    } = this.state;

    const debugItems = formDebbugItems(this);
    const hasSmartWallet = userHasSmartWallet(accounts);
    const colors = getThemeColors(theme);
    const pickedThemeValue = isSetAsSystemPrefTheme ? SYSTEM_DEFAULT_THEME : themeType;


    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'General settings' }] }}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: 0, paddingBottom: spacing.large }}
          ref={(scrollView: ScrollView) => { this.scrollView = scrollView; }}
        >

          {/* <ProfileSettingsItem
            key="contactInfo"
            label="Share contact info"
            onPress={this.navigateToContactInfo}
          /> */}

          <SettingsSection
            sectionTitle="Security"
            sectionItems={formSecurityItems(this, supportedBiometryType)}
          />

          <SettingsSection
            sectionTitle="Currency"
            sectionItems={formCurrencyItems(this)}
          />

          <SettingsSection
            sectionTitle="Theme"
            sectionItems={formThemeItems(this)}
          />

          {!isProdEnv &&
          <SettingsSection
            sectionTitle="Referral"
            sectionItems={formReferralItems(this)}
          />}

          <SettingsSection
            sectionTitle="Support"
            sectionItems={formSupportItems(this)}
          />

          <SettingsSection
            sectionTitle="Legal"
            sectionItems={formLegalItems(this)}
          />

          {smartWalletFeatureEnabled && __DEV__ &&
          <SettingsSection
            sectionTitle="Smart wallet"
            sectionItems={formSmartWalletDevItems(this)}
          />}

          {!!debugItems.length &&
          <SettingsSection
            sectionTitle="Debug"
            sectionItems={debugItems}
          />}

          <SettingsSection
            sectionTitle="System"
            sectionItems={formSystemItems(this)}
          />

          <View onLayout={(e) => {
            if (scrollToSection === KEY_SECTION && this.scrollView) {
              const yPos = get(e, 'nativeEvent.layout.y', 0);
              this.scrollView.scrollTo({ x: 0, y: yPos, animated: true });
            }
          }}
          >
            <SettingsSection
              sectionTitle="Key"
              sectionItems={formKeyItems(this)}
              isCardsList
            />
          </View>

          {!!hasSmartWallet && smartWalletFeatureEnabled &&
          <SettingsSection
            sectionTitle="Smart Wallet"
            sectionItems={formSmartWalletItems(this)}
            isCardsList
          />}

          <SettingsSection
            sectionTitle="More"
            sectionItems={formMiscItems(this, colors)}
            isCardsList
          />

        </ScrollView>

        {/* BIOMETRIC LOGIN */}
        <SlideModal
          isVisible={visibleModal === 'checkPin'}
          onModalHidden={this.handleBiometricsCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
        >
          <Wrapper flex={1}>
            <CheckPin
              onPinValid={
                (pin, { privateKey }) => this.handleChangeUseBiometrics(
                  !useBiometrics, !useBiometrics ? privateKey : undefined,
                )
              }
            />
          </Wrapper>
        </SlideModal>

        {/* LEGAL MODALS */}
        <HTMLContentModal
          isVisible={visibleModal === 'termsOfService'}
          modalHide={() => this.setState({ visibleModal: null })}
          htmlEndpoint="terms_of_service"
        />

        <HTMLContentModal
          isVisible={visibleModal === 'privacyPolicy'}
          modalHide={() => this.setState({ visibleModal: null })}
          htmlEndpoint="privacy_policy"
        />

        {/* SYSTEM INFO MODAL */}
        <SlideModal
          isVisible={visibleModal === 'systemInfo'}
          fullScreen
          showHeader
          title="System info"
          onModalHide={() => this.setState({ visibleModal: null })}
        >
          <SystemInfoModal headerOnClose={() => this.setState({ visibleModal: null })} />
        </SlideModal>

        {/* REFERRAL */}
        <SlideModal
          isVisible={visibleModal === 'referralCode'}
          title="Referral code"
          onModalHide={this.toggleSlideModalOpen}
        >
          <ReferralCodeModal username={user.username} onModalClose={this.toggleSlideModalOpen} />
        </SlideModal>

        <SlideModal
          isVisible={visibleModal === 'claimTokens'}
          fullScreen
          title="Claim tokens"
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <View style={{ marginTop: 15, flex: 1 }}>
              <SettingsModalTitle>
                Enter your code
              </SettingsModalTitle>
              <EditProfile
                fields={codeFormFields}
                onSubmit={this.handleCodeClaim}
                buttonTitle="Claim"
              />
            </View>
          </Wrapper>
        </SlideModal>

        {/* BASE CURRENCY */}
        <SlideModal
          isVisible={visibleModal === 'baseCurrency'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose your base currency
          </SettingsModalTitle>
          <FlatList
            data={currencies}
            renderItem={this.renderListItem(
              'currency', this.handleCurrencyUpdate, baseFiatCurrency || defaultFiatCurrency)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>

        {/* THEME */}
        <SlideModal
          isVisible={visibleModal === 'theme'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose theme
          </SettingsModalTitle>
          <FlatList
            data={themesToSelect}
            renderItem={this.renderListItem('theme', this.handleThemeUpdate, pickedThemeValue)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>

        {/* ANALYTICS */}
        <SlideModal
          isVisible={visibleModal === 'analytics'}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
          avoidKeyboard
          title="Usage analytics"
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

        {/* JOIN BETA */}
        <SlideModal
          isVisible={visibleModal === 'joinBeta'}
          fullScreen
          showHeader
          onModalHidden={this.handleJoinBetaModalClose}
          avoidKeyboard
          title="Smart Wallet Early Access"
          onModalHide={() => this.setState({ visibleModal: null })}
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
              style={{
                marginBottom: 13,
              }}
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
        >
          <StyledWrapper regularPadding flex={1}>
            <View>
              <Paragraph small>
                By confirming, you will leave the Early Access program. As a result, your access to the
                Smart Wallet, Pillar Payment Network, Bitcoin Wallet and any funds stored on them will be lost.
              </Paragraph>
              <Paragraph small>
                We strongly recommend that you transfer all assets from the Smart Wallet and Pillar Network to your Key
                Based Wallet before leaving this Program.
              </Paragraph>
              <Paragraph small>
                If you wish to re-gain early access to Smart Wallet or Bitcoin Wallet (and re-gain access to the funds
                on your Smart Wallet or Bitcoin Wallet), you will need to apply again.
              </Paragraph>
            </View>
            <Button
              title="Leave Program"
              onPress={() => { this.setState({ visibleModal: null, leaveBetaPressed: true }); }}
              style={{ marginBottom: 13 }}
            />
          </StyledWrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  appSettings: {
    data: {
      useBiometrics = false,
      baseFiatCurrency,
      optOutTracking = false,
      userJoinedBeta = false,
      themeType,
      isSetAsSystemPrefTheme,
    },
  },
  notifications: { intercomNotificationsCount },
  wallet: { backupStatus },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  user,
  baseFiatCurrency,
  intercomNotificationsCount,
  optOutTracking,
  backupStatus,
  useBiometrics,
  smartWalletFeatureEnabled,
  userJoinedBeta,
  themeType,
  isSetAsSystemPrefTheme,
  accounts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  saveBaseFiatCurrency: (currency: string) => dispatch(saveBaseFiatCurrencyAction(currency)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  changeUseBiometrics: (enabled: boolean, privateKey?: string) => dispatch(
    changeUseBiometricsAction(enabled, privateKey),
  ),
  cleanSmartWalletAccounts: () => dispatch(cleanSmartWalletAccountsAction()),
  saveOptOutTracking: (status: boolean) => dispatch(saveOptOutTrackingAction(status)),
  setUserJoinedBeta: (status: boolean) => dispatch(setUserJoinedBetaAction(status)),
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
  changeAppTheme: (themeType: string, shouldSetAsPref: boolean) => dispatch(
    changeAppThemeAction(themeType, shouldSetAsPref),
  ),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(Settings));
