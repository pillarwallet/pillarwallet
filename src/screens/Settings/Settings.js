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
import { Keyboard, View, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import TouchID from 'react-native-touch-id';
import Intercom from 'react-native-intercom';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { saveBaseFiatCurrencyAction, changeUseBiometricsAction } from 'actions/appSettingsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { repairStorageAction } from 'actions/appActions';
import { cleanSmartWalletAccountsAction } from 'actions/smartWalletActions';

// components
import { Wrapper } from 'components/Layout';
import { BoldText } from 'components/Typography';
import Toast from 'components/Toast';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import ReferralCodeModal from 'screens/Profile/ReferralCodeModal';
import EditProfile from 'screens/Profile/EditProfile';
import SystemInfoModal from 'components/SystemInfoModal';

// services
import Storage from 'services/storage';
import ChatService from 'services/chat';

// constants
import { CONFIRM_CLAIM, CHANGE_PIN_FLOW } from 'constants/navigationConstants';

// utils
import { delay } from 'utils/common';
import { isProdEnv } from 'utils/environment';
import { baseColors, fontSizes, fontWeights, spacing } from 'utils/variables';

// partials
import { SettingsSection } from './SettingsSection';

type State = {
  visibleModal: ?string,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
  showSystemInfoModal: boolean,
  showCheckPinModal: boolean,
  showBiometricsSelector: boolean,
}

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  intercomNotificationsCount: number,
  repairStorage: Function,
  hasDBConflicts: boolean,
  cleanSmartWalletAccounts: Function,
  changeUseBiometrics: (value: boolean) => Function,
  resetIncorrectPassword: () => Function,
  saveBaseFiatCurrency: (currency: ?string) => Function,
  // baseFiatCurrency: ?string,
  smartWalletFeatureEnabled: boolean,
}

const storage = new Storage('db');
const chat = new ChatService();

const SettingsModalTitle = styled(BoldText)`
  line-height: ${fontSizes.medium};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
`;

const formSecurityItems = (that) => {
  const { navigation, useBiometrics } = that.props;
  const { showBiometricsSelector } = that.state;
  const generalSecurityItems = [
    {
      key: 'changePin',
      title: 'Change PIN',
      onPress: () => navigation.navigate(CHANGE_PIN_FLOW),
    },
  ];

  if (showBiometricsSelector) {
    generalSecurityItems.push({
      key: 'biometricLogin',
      title: 'Biometric Login',
      onPress: () => that.setState({ showCheckPinModal: true }),
      toggle: true,
      value: useBiometrics,
    });
  }

  return generalSecurityItems;
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
  const { repairStorage, hasDBConflicts } = that.props;
  const debugItems = [];

  if (hasDBConflicts) {
    debugItems.push({
      key: 'repairDB',
      title: 'Repair Local Storage',
      onPress: repairStorage,
    });
  }

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
      onPress: that.toggleTermsConditionsModal,
    },
    {
      key: 'privacyPolicy',
      title: 'Privacy Policy',
      onPress: that.togglePrivacyPolicyModal,
    },
  ];
};

const formSystemItems = (that) => {
  return [
    {
      key: 'systemInfo',
      title: 'System Info',
      onPress: () => that.setState({ showSystemInfoModal: true }),
    },
  ];
};

const formSmartWalletItems = (that) => {
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

class Settings extends React.Component<Props, State> {
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
      showBiometricsSelector: false, // eslint-disable-line
    };
  }

  componentDidMount() {
    TouchID.isSupported({})
      .then(() => this.setState({ showBiometricsSelector: true })) // eslint-disable-line
      .catch(() => null);
  }

  clearLocalStorage() {
    storage.removeAll();
    chat.client.resetAccount().catch(() => null);
    Toast.show({ title: 'Success', type: 'success', message: 'Local storage was cleared' });
  }

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({ visibleModal });
  };

  toggleTermsConditionsModal = () => {
    this.setState({ showTermsConditionsModal: !this.state.showTermsConditionsModal });
  };

  togglePrivacyPolicyModal = () => {
    this.setState({ showPrivacyPolicyModal: !this.state.showPrivacyPolicyModal });
  };

  handleChangeUseBiometrics = (value) => {
    const { changeUseBiometrics } = this.props;
    changeUseBiometrics(value);
    this.setState({ showCheckPinModal: false }, () => {
      const message = value ? 'Biometric login enabled' : 'Biometric login disabled';
      delay(500)
        .then(() => Toast.show({ title: 'Success', type: 'success', message }))
        .catch(() => null);
    });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  }

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

  // navigateToContactInfo = () => {
  //   requestAnimationFrame(() => {
  //     const { navigation } = this.props;
  //     navigation.navigate(CONTACT_INFO);
  //   });
  // }

  render() {
    const {
      user,
      // appSettings: { appearanceSettings },
      useBiometrics,
      smartWalletFeatureEnabled,
    } = this.props;

    const {
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSystemInfoModal,
      showCheckPinModal,
      visibleModal,
    } = this.state;

    const debugItems = formDebbugItems(this);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'General settings' }],
        }}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.large, paddingTop: 0 }}
        >

          {/* <ProfileSettingsItem
            key="contactInfo"
            label="Share contact info"
            onPress={this.navigateToContactInfo}
          /> */}

          <SettingsSection
            sectionTitle="Security"
            sectionItems={formSecurityItems(this)}
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

          {smartWalletFeatureEnabled &&
          <SettingsSection
            sectionTitle="Smart wallet"
            sectionItems={formSmartWalletItems(this)}
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

        </ScrollView>

        {/* BIOMETRIC LOGIN */}
        <SlideModal
          isVisible={showCheckPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1}>
            <CheckPin onPinValid={() => this.handleChangeUseBiometrics(!useBiometrics)} />
          </Wrapper>
        </SlideModal>

        {/* LEGAL MODALS */}
        <HTMLContentModal
          isVisible={showTermsConditionsModal}
          modalHide={this.toggleTermsConditionsModal}
          htmlEndpoint="terms_of_service"
        />

        <HTMLContentModal
          isVisible={showPrivacyPolicyModal}
          modalHide={this.togglePrivacyPolicyModal}
          htmlEndpoint="privacy_policy"
        />

        {/* SYSTEM INFO MODAL */}
        <SlideModal
          isVisible={showSystemInfoModal}
          fullScreen
          showHeader
          title="system info"
          onModalHide={() => this.setState({ showSystemInfoModal: false })}
        >
          <SystemInfoModal headerOnClose={() => this.setState({ showSystemInfoModal: false })} />
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
          isVisible={this.state.visibleModal === 'claimTokens'}
          fullScreen
          title="Claim tokens"
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          backgroundColor={baseColors.snowWhite}
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
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  appSettings: { data: { useBiometrics = false, baseFiatCurrency }, data: appSettings },
  notifications: { intercomNotificationsCount },
  session: { data: { hasDBConflicts } },
  wallet: { backupStatus },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  user,
  baseFiatCurrency,
  intercomNotificationsCount,
  appSettings,
  hasDBConflicts,
  backupStatus,
  useBiometrics,
  smartWalletFeatureEnabled,
});

const mapDispatchToProps = (dispatch: Function) => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  changeUseBiometrics: (value) => dispatch(changeUseBiometricsAction(value)),
  repairStorage: () => dispatch(repairStorageAction()),
  cleanSmartWalletAccounts: () => dispatch(cleanSmartWalletAccountsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
