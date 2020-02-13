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
import { FlatList, Alert, ScrollView, Keyboard, View } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import * as Keychain from 'react-native-keychain';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import {
  CHANGE_PIN_FLOW,
  REVEAL_BACKUP_PHRASE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  OTP,
  CONFIRM_CLAIM,
  CONTACT_INFO,
} from 'constants/navigationConstants';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import { SubHeading, BaseText, Paragraph } from 'components/Typography';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import SystemInfoModal from 'components/SystemInfoModal';
import Toast from 'components/Toast';
import CountrySelect from 'components/CountrySelect';
import Checkbox from 'components/Checkbox';
import CheckPin from 'components/CheckPin';
import {
  saveBaseFiatCurrencyAction,
  changeUseBiometricsAction,
  updateAssetsLayoutAction,
  saveOptOutTrackingAction,
  setUserJoinedBetaAction,
} from 'actions/appSettingsActions';
import { updateUserAction, createOneTimePasswordAction } from 'actions/userActions';
import { resetIncorrectPasswordAction, lockScreenAction, logoutAction } from 'actions/authActions';
import { cleanSmartWalletAccountsAction } from 'actions/smartWalletActions';
import { logScreenViewAction, logEventAction } from 'actions/analyticsActions';
import { isProdEnv } from 'utils/environment';
import Storage from 'services/storage';
import ChatService from 'services/chat';
import { fontTrackings, spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { delay } from 'utils/common';
import ProfileSettingsItem from 'components/ListItem/SettingsItem';
import Button from 'components/Button';
import EditProfile from './EditProfile';
import SettingsModalTitle from './SettingsModalTitle';
import ReferralCodeModal from './ReferralCodeModal';

// sections
import AppearanceSettingsSection from './AppearanceSettingsSection';

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency }));
const storage = Storage.getInstance('db');
const chat = new ChatService();

const ListWrapper = styled.View`
  padding-bottom: 40px;
`;

const ListSeparator = styled.View`
  padding: 20px ${spacing.rhythm}px;
  border-top-width: ${props => props.first ? 0 : '1px'};
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
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

const StyledWrapper = styled(Wrapper)`
  justify-content: space-between;
  padding-bottom: ${spacing.rhythm}px;
  margin-top: 25px;
`;

const Description = styled(Paragraph)`
  padding-bottom: ${spacing.rhythm}px;
`;

const cityFormFields = [{
  label: 'City',
  name: 'city',
  type: 'city',
  config: { placeholder: 'City' },
}];

const emailFormFields = [{
  label: 'Email',
  name: 'email',
  type: 'email',
  config: {
    placeholder: 'user@example.com',
    autoCapitalize: 'none',
    error: 'Please specify valid email',
  },
}];

const phoneFormFields = [{
  label: 'Phone',
  name: 'phone',
  type: 'phone',
  config: {
    keyboardType: 'phone-pad',
    placeholder: '+447472883222',
    autoCapitalize: 'none',
    error: 'Please specify valid phone number',
  },
}];

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

const fullNameFormFields = [{
  label: 'First name',
  name: 'firstName',
  type: 'firstName',
  config: { placeholder: 'First name' },
}, {
  label: 'Last name',
  name: 'lastName',
  type: 'lastName',
  config: { placeholder: 'Last name' },
}];

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  saveBaseFiatCurrency: (currency: string) => void,
  baseFiatCurrency: ?string,
  appSettings: Object,
  intercomNotificationsCount: number,
  updateAssetsLayout: (value: string) => void,
  updateUser: (walletId: string, field: Object, callback?: Function) => void,
  createOneTimePassword: (walletId: string, field: Object, callback?: Function) => void,
  resetIncorrectPassword: () => void,
  lockScreen: () => void,
  logoutUser: () => void,
  backupStatus: Object,
  useBiometrics: ?boolean,
  changeUseBiometrics: (enabled: boolean, privateKey: string) => void,
  cleanSmartWalletAccounts: Function,
  smartWalletFeatureEnabled: boolean,
  logScreenView: (view: string, screen: string) => void,
  logEvent: (name: string) => void,
  saveOptOutTracking: (status: boolean) => void,
  optOutTracking: boolean,
  setUserJoinedBeta: (status: boolean) => void,
  userJoinedBeta: boolean,
};

type State = {
  visibleModal: string | null,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
  showSystemInfoModal: boolean,
  showCheckPinModal: boolean,
  showBiometricsSelector: boolean,
  showTrackingModal: boolean,
  showJoinBetaModal: boolean,
  joinBetaPressed: boolean,
};

class Profile extends React.Component<Props, State> {
  static defaultProps = {
    useBiometrics: false,
  };

  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;
    const visibleModal = navigation.getParam('visibleModal', null);
    this.state = {
      visibleModal,
      showTermsConditionsModal: false,
      showPrivacyPolicyModal: false,
      showSystemInfoModal: false,
      showCheckPinModal: false,
      showBiometricsSelector: false,
      showTrackingModal: false,
      showJoinBetaModal: false,
      joinBetaPressed: false,
    };
  }

  componentDidMount() {
    const { logScreenView } = this.props;

    logScreenView('View profile', 'Profile');

    Keychain.getSupportedBiometryType()
      .then(supported => this.setState({ showBiometricsSelector: !!supported }))
      .catch(() => null);
  }

  clearLocalStorage() {
    const { logEvent } = this.props;

    storage.removeAll();
    chat.client.resetAccount().catch(() => null);
    Toast.show({ title: 'Success', type: 'success', message: 'Local storage was cleared' });
    logEvent('local_storage_cleared');
  }

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({ visibleModal });
  };

  toggleTermsConditionsModal = () => {
    this.setState((prev: State) => ({ showTermsConditionsModal: !prev.showTermsConditionsModal }));
  };

  togglePrivacyPolicyModal = () => {
    this.setState((prev: State) => ({ showPrivacyPolicyModal: !prev.showPrivacyPolicyModal }));
  };

  toggleTrackingModal = () => {
    this.setState((prev: State) => ({ showTrackingModal: !prev.showTrackingModal }));
  }

  handleChangeUseBiometrics = (enabled, privateKey) => {
    const { changeUseBiometrics } = this.props;
    changeUseBiometrics(enabled, privateKey);
    this.setState({ showCheckPinModal: false }, () => {
      const message = enabled ? 'Biometric login enabled' : 'Biometric login disabled';
      delay(500)
        .then(() => Toast.show({ title: 'Success', type: 'success', message }))
        .catch(() => null);
    });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  };

  handleUserFieldUpdate = (field: Object) => {
    Keyboard.dismiss();
    const {
      updateUser,
      user,
    } = this.props;

    updateUser(user.walletId, field, () => this.toggleSlideModalOpen(null));
  };

  handleToggleOptOutTracking = () => {
    const { saveOptOutTracking, optOutTracking } = this.props;

    saveOptOutTracking(!optOutTracking);
  };

  handleUserPhoneFieldUpdate = (field: Object) => {
    Keyboard.dismiss();
    const {
      updateUser,
      user,
      navigation,
      createOneTimePassword,
    } = this.props;

    const createOTP = () => {
      createOneTimePassword(user.walletId, field, () => {
        this.toggleSlideModalOpen(null);
        navigation.navigate(OTP, { phone: field.phone });
      });
    };

    updateUser(user.walletId, field, createOTP);
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

  handleLogoutMessage = () => {
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

  renderListItem = (field: string, onSelect: Function) => ({ item: { name } }: Object) => {
    return (
      <ProfileSettingsItem
        key={name}
        label={name}
        onPress={() => onSelect({ [field]: name })}
      />
    );
  };

  handleBackup = (isBackedUp?: boolean) => {
    const { navigation } = this.props;
    if (!isBackedUp) {
      // DO BACKUP
      navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW, { backupViaSettings: true });
    } else {
      navigation.navigate(REVEAL_BACKUP_PHRASE);
    }
  };

  navigateToContactInfo = () => {
    requestAnimationFrame(() => {
      const { navigation } = this.props;
      navigation.navigate(CONTACT_INFO);
    });
  };

  handleUpdateAppearance = (layoutId: string) => {
    const { updateAssetsLayout } = this.props;
    updateAssetsLayout(layoutId);
  };

  onJoinBetaModalHidden = () => {
    // this is needed so that toast message can be shown in settings instead of slide modal that closes
    if (this.state.joinBetaPressed) {
      this.setState({ joinBetaPressed: false });
      this.props.setUserJoinedBeta(true);
    }
  };

  render() {
    const {
      user,
      intercomNotificationsCount,
      baseFiatCurrency,
      navigation,
      lockScreen,
      appSettings: { appearanceSettings },
      backupStatus,
      useBiometrics,
      smartWalletFeatureEnabled,
      optOutTracking,
      setUserJoinedBeta,
      userJoinedBeta,
    } = this.props;

    const {
      isImported,
      isBackedUp,
    } = backupStatus;

    const {
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSystemInfoModal,
      showCheckPinModal,
      showBiometricsSelector,
      showTrackingModal,
      showJoinBetaModal,
    } = this.state;

    const isWalletBackedUp = isImported || isBackedUp;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header white title="settings" onBack={() => navigation.goBack(null)} />
        <SlideModal
          isVisible={showTrackingModal}
          fullScreen
          showHeader
          onModalHide={this.toggleTrackingModal}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Usage analytics
            </SettingsModalTitle>

            <StyledWrapper>
              <Checkbox
                checked={!optOutTracking}
                onPress={() => this.handleToggleOptOutTracking()}
                wrapperStyle={{ marginBottom: 20 }}
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

        <SlideModal
          isVisible={this.state.visibleModal === 'country'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper flex={1}>
            <SettingsModalTitle extraHorizontalSpacing>
              Choose your country
            </SettingsModalTitle>
            <CountrySelect
              renderItem={this.renderListItem('country', this.handleUserFieldUpdate)}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'city'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your city name
            </SettingsModalTitle>
            <EditProfile
              fields={cityFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ city: user.city }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'email'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your email
            </SettingsModalTitle>
            <EditProfile
              fields={emailFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ email: user.email }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'referralCode'}
          title="Referral code"
          onModalHide={this.toggleSlideModalOpen}
        >
          <ReferralCodeModal username={user.username} onModalClose={this.toggleSlideModalOpen} />
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'phone'}
          fullScreen
          title="Phone verification"
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <View style={{ marginTop: 15, flex: 1 }}>
              <SettingsModalTitle>
                Enter your phone
              </SettingsModalTitle>
              <EditProfile
                fields={phoneFormFields}
                onSubmit={this.handleUserPhoneFieldUpdate}
                value={{ phone: user.phone }}
              />
            </View>
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'claimTokens'}
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
        <SlideModal
          isVisible={this.state.visibleModal === 'fullName'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <ScrollView
              contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}
              keyboardShouldPersistTaps="handled"
            >
              <SettingsModalTitle>
                Enter your full name
              </SettingsModalTitle>
              <EditProfile
                fields={fullNameFormFields}
                onSubmit={this.handleUserFieldUpdate}
                value={{ firstName: user.firstName, lastName: user.lastName }}
              />
            </ScrollView>
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'baseCurrency'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose your base currency
          </SettingsModalTitle>
          <FlatList
            data={currencies}
            renderItem={this.renderListItem('currency', this.handleCurrencyUpdate)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>
        <ScrollWrapper>
          <ListWrapper>
            <ListSeparator first>
              <SubHeading>PROFILE SETTINGS</SubHeading>
            </ListSeparator>

            <ProfileSettingsItem
              key="country"
              label="Country"
              value={user.country}
              onPress={() => this.toggleSlideModalOpen('country')}
            />

            <ProfileSettingsItem
              key="city"
              label="City"
              value={user.city}
              onPress={() => this.toggleSlideModalOpen('city')}
            />

            <ProfileSettingsItem
              key="email"
              label="Email"
              value={user.email}
              onPress={() => this.toggleSlideModalOpen('email')}
            />

            <ProfileSettingsItem
              key="fullName"
              label="Full name"
              value={user.firstName ? `${user.firstName} ${user.lastName}` : null}
              onPress={() => this.toggleSlideModalOpen('fullName')}
            />
            {!isProdEnv && (
              <ProfileSettingsItem
                key="phone"
                label="Phone"
                value={user.isPhoneVerified ? `${user.phone}` : null}
                warningNotification={!user.isPhoneVerified}
                onPress={() => this.toggleSlideModalOpen('phone')}
              />)
            }
            <ProfileSettingsItem
              key="contactInfo"
              label="Share contact info"
              onPress={this.navigateToContactInfo}
            />
            <ListSeparator>
              <SubHeading>GENERAL SETTINGS</SubHeading>
            </ListSeparator>

            <ProfileSettingsItem
              key="baseCurrency"
              label="Base currency"
              value={baseFiatCurrency || defaultFiatCurrency}
              onPress={() =>
                this.setState({ visibleModal: 'baseCurrency' })}
            />

            <ProfileSettingsItem
              key="backupWallet"
              label={isWalletBackedUp ? 'Reveal backup phrase' : 'Backup Wallet'}
              warningNotification={!isWalletBackedUp}
              onPress={() => this.handleBackup(isWalletBackedUp)}
            />

            <ProfileSettingsItem
              key="changePin"
              label="Change PIN"
              onPress={() => this.props.navigation.navigate(CHANGE_PIN_FLOW)}
            />

            {showBiometricsSelector &&
            <ProfileSettingsItem
              key="useBiometrics"
              label="Biometric Login"
              value={useBiometrics}
              toggle
              onPress={() => this.setState({ showCheckPinModal: true })}
            />
            }

            <SlideModal
              isVisible={showCheckPinModal}
              onModalHide={this.handleCheckPinModalClose}
              title="Enter pincode"
              centerTitle
              fullScreen
              showHeader
            >
              <Wrapper flex={1}>
                <CheckPin
                  onPinValid={
                    (pin, { privateKey }) => this.handleChangeUseBiometrics(!useBiometrics, privateKey)
                  }
                />
              </Wrapper>
            </SlideModal>

            <ListSeparator>
              <SubHeading>APPEARANCE SETTINGS</SubHeading>
            </ListSeparator>
            <AppearanceSettingsSection
              settings={appearanceSettings}
              onUpdate={this.handleUpdateAppearance}
            />

            {!isProdEnv && (
              <View>
                <ListSeparator>
                  <SubHeading>REFERRAL</SubHeading>
                </ListSeparator>
                <ProfileSettingsItem
                  key="referralCode"
                  label="Invite friends"
                  onPress={() => this.toggleSlideModalOpen('referralCode')}
                />
                <ProfileSettingsItem
                  key="claimTokens"
                  label="Get PLR's tokens"
                  onPress={() => this.toggleSlideModalOpen('claimTokens')}
                />
              </View>
            )}

            <ListSeparator>
              <SubHeading>ABOUT</SubHeading>
            </ListSeparator>

            <ProfileSettingsItem
              key="chat"
              label="Chat with us"
              notificationsCount={intercomNotificationsCount}
              onPress={() => Intercom.displayMessenger()}
            />

            <ProfileSettingsItem
              key="knowledgebase"
              label="Knowledge Base"
              onPress={() => Intercom.displayHelpCenter()}
            />

            <ProfileSettingsItem
              key="termsOfUse"
              label="Terms of Use"
              onPress={this.toggleTermsConditionsModal}
            />

            <HTMLContentModal
              isVisible={showTermsConditionsModal}
              modalHide={this.toggleTermsConditionsModal}
              htmlEndpoint="terms_of_service"
            />

            <ListSeparator>
              <SubHeading>PRIVACY</SubHeading>
            </ListSeparator>

            <ProfileSettingsItem
              key="privacyPolicy"
              label="Privacy Policy"
              onPress={this.togglePrivacyPolicyModal}
            />

            <ProfileSettingsItem
              key="privacyTracking"
              label="Usage analytics"
              onPress={this.toggleTrackingModal}
            />

            <HTMLContentModal
              isVisible={showPrivacyPolicyModal}
              modalHide={this.togglePrivacyPolicyModal}
              htmlEndpoint="privacy_policy"
            />

            {smartWalletFeatureEnabled && (
              <React.Fragment>
                <ListSeparator>
                  <SubHeading>Smart wallet</SubHeading>
                </ListSeparator>
                <ProfileSettingsItem
                  key="clearSmartAccounts"
                  label="Clear Smart Accounts"
                  onPress={() => { this.props.cleanSmartWalletAccounts(); }}
                />
              </React.Fragment>
            )}

            {!!__DEV__ &&
            <React.Fragment>
              <ListSeparator>
                <SubHeading>DEBUG</SubHeading>
              </ListSeparator>

              {!!__DEV__ &&
              <ProfileSettingsItem
                key="clearStorage"
                label="Clear Local Storage"
                onPress={() => { this.clearLocalStorage(); }}
              />}
            </React.Fragment>}

            <ListSeparator>
              <SubHeading>SYSTEM</SubHeading>
            </ListSeparator>

            {userJoinedBeta &&
              <ProfileSettingsItem
                key="joinBeta"
                label="Leave Beta Testing"
                onPress={() => setUserJoinedBeta(false)}
              />
            }

            {!userJoinedBeta &&
              <ProfileSettingsItem
                key="joinBeta"
                label="Join Beta Testing"
                onPress={() => this.setState({ showJoinBetaModal: true })}
              />
            }

            <ProfileSettingsItem
              key="systemInfo"
              label="System Info"
              onPress={() => this.setState({ showSystemInfoModal: true })}
            />

            <ProfileSettingsItem
              key="lockScreen"
              label="Lock Screen"
              onPress={lockScreen}
            />

            <ProfileSettingsItem
              key="deleteWallet"
              label="Delete Wallet"
              onPress={this.handleLogoutMessage}
            />

            <SlideModal
              isVisible={showSystemInfoModal}
              fullScreen
              showHeader
              title="system info"
              onModalHide={() => this.setState({ showSystemInfoModal: false })}
            >
              <SystemInfoModal headerOnClose={() => this.setState({ showSystemInfoModal: false })} />
            </SlideModal>

            <SlideModal
              isVisible={showJoinBetaModal}
              fullScreen
              showHeader
              onModalHidden={this.onJoinBetaModalHidden}
              avoidKeyboard
              title="join beta"
              onModalHide={() => this.setState({ showJoinBetaModal: false })}
            >
              <StyledWrapper regularPadding flex={1}>
                <Description small>
                  {
                    'By choosing this you will be added to our Analytics data collection.' +
                    'Through this, Pillar will collect your username in order to enable' +
                    'new features and monitor your new wallet experience for any bugs and/or crashes.' +
                    'You can choose to leave the Early Access program at any time via the "System" under Settings.'
                  }
                </Description>
                <Button
                  title="Join Beta Testing"
                  onPress={() => this.setState({ showJoinBetaModal: false, joinBetaPressed: true })}
                  style={{
                    marginBottom: 13,
                  }}
                />
              </StyledWrapper>
            </SlideModal>
          </ListWrapper>

        </ScrollWrapper>
      </Container >
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
    },
    data: appSettings,
  },
  notifications: { intercomNotificationsCount },
  wallet: { backupStatus },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}: RootReducerState): $Shape<Props> => ({
  user,
  baseFiatCurrency,
  intercomNotificationsCount,
  appSettings,
  backupStatus,
  useBiometrics,
  smartWalletFeatureEnabled,
  optOutTracking,
  userJoinedBeta,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  saveBaseFiatCurrency: (currency: string) => dispatch(saveBaseFiatCurrencyAction(currency)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  updateUser: (walletId: string, field: Object, callback?: Function) =>
    dispatch(updateUserAction(walletId, field, callback)),
  createOneTimePassword: (walletId: string, field: Object, callback?: Function) =>
    dispatch(createOneTimePasswordAction(walletId, field, callback)),
  updateAssetsLayout: (value: string) => dispatch(updateAssetsLayoutAction(value)),
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
  changeUseBiometrics: (enabled, privateKey) => dispatch(changeUseBiometricsAction(enabled, privateKey)),
  cleanSmartWalletAccounts: () => dispatch(cleanSmartWalletAccountsAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  logEvent: (name: string) => dispatch(logEventAction(name)),
  saveOptOutTracking: (status: boolean) => dispatch(saveOptOutTrackingAction(status)),
  setUserJoinedBeta: (status: boolean) => dispatch(setUserJoinedBetaAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
