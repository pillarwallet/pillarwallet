// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { FlatList, Alert, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import {
  CHANGE_PIN_FLOW,
  REVEAL_BACKUP_PHRASE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
} from 'constants/navigationConstants';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import { SubHeading } from 'components/Typography';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import SystemInfoModal from 'components/SystemInfoModal';
import Toast from 'components/Toast';
import CountrySelect from 'components/CountrySelect';
import {
  saveBaseFiatCurrencyAction,
  updateAppSettingsAction,
} from 'actions/appSettingsActions';
import { updateUserAction } from 'actions/userActions';
import { repairStorageAction } from 'actions/appActions';
import { resetIncorrectPasswordAction, lockScreenAction, logoutAction } from 'actions/authActions';
import Storage from 'services/storage';
import ChatService from 'services/chat';
import { baseColors, spacing } from 'utils/variables';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileForm from './ProfileForm';
import SettingsModalTitle from './SettingsModalTitle';

// sections
import AppearanceSettingsSection from './AppearanceSettingsSection';

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency }));
const storage = new Storage('db');
const chat = new ChatService();

const ListWrapper = styled.View`
  padding-bottom: 40px;
  background-color: ${baseColors.lighterGray};
`;

const ListSeparator = styled.View`
  padding: 20px ${spacing.rhythm}px;
  border-top-width: ${props => props.first ? 0 : '1px'};
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
  background-color: ${baseColors.lighterGray};
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
  config: { placeholder: 'user@example.com', autoCapitalize: 'none', error: 'Please specify valid email' },
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
  saveBaseFiatCurrency: (currency: ?string) => Function,
  baseFiatCurrency: ?string,
  appSettings: Object,
  intercomNotificationsCount: number,
  hasDBConflicts: boolean,
  repairStorage: Function,
  updateAppSettings: (path: string, value: any) => Function,
  updateUser: (walletId: string, field: Object) => Function,
  resetIncorrectPassword: () => Function,
  lockScreen: () => Function,
  logoutUser: () => Function,
  backupStatus: Object,
}

type State = {
  visibleModal: string | null,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
  showSystemInfoModal: boolean,
}

class Profile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      visibleModal: null,
      showTermsConditionsModal: false,
      showPrivacyPolicyModal: false,
      showSystemInfoModal: false,
    };
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

  handleUserFieldUpdate = (field: Object) => {
    const { updateUser, user } = this.props;
    updateUser(user.walletId, field);
    this.toggleSlideModalOpen(null);
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

  render() {
    const {
      user,
      intercomNotificationsCount,
      baseFiatCurrency,
      navigation,
      lockScreen,
      updateAppSettings,
      appSettings: { appearanceSettings },
      hasDBConflicts,
      repairStorage,
      backupStatus,
    } = this.props;

    const {
      isImported,
      isBackedUp,
    } = backupStatus;

    const {
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSystemInfoModal,
    } = this.state;

    const isWalletBackedUp = isImported || isBackedUp;

    return (
      <Container inset={{ bottom: 0 }}>
        <Header gray title="settings" onBack={() => navigation.goBack(null)} />
        <SlideModal
          isVisible={this.state.visibleModal === 'country'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          backgroundColor={baseColors.lightGray}
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
          backgroundColor={baseColors.snowWhite}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your city name
            </SettingsModalTitle>
            <ProfileForm
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
          backgroundColor={baseColors.snowWhite}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your email
            </SettingsModalTitle>
            <ProfileForm
              fields={emailFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ email: user.email }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'fullName'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          backgroundColor={baseColors.snowWhite}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}>
              <SettingsModalTitle>
                Enter your full name
              </SettingsModalTitle>
              <ProfileForm
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
          backgroundColor={baseColors.lightGray}
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

            <ListSeparator>
              <SubHeading>APPEARANCE SETTINGS</SubHeading>
            </ListSeparator>
            <AppearanceSettingsSection settings={appearanceSettings} onUpdate={updateAppSettings} />
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
              label="Knowledgebase"
              onPress={() => Intercom.displayHelpCenter()}
            />

            <ProfileSettingsItem
              key="termsOfUse"
              label="Terms of Use"
              onPress={this.toggleTermsConditionsModal}
            />

            <ProfileSettingsItem
              key="privacyPolicy"
              label="Privacy Policy"
              onPress={this.togglePrivacyPolicyModal}
            />

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

            {(!!hasDBConflicts || !!__DEV__) &&
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
              {hasDBConflicts &&
                <ProfileSettingsItem
                  key="repairDB"
                  label="Repair Local Storage"
                  onPress={repairStorage}
                />}
            </React.Fragment>}

            <ListSeparator>
              <SubHeading>SYSTEM</SubHeading>
            </ListSeparator>

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
          </ListWrapper>

        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  appSettings: { data: { baseFiatCurrency }, data: appSettings },
  notifications: { intercomNotificationsCount },
  session: { data: { hasDBConflicts } },
  wallet: { backupStatus },
}) => ({
  user,
  baseFiatCurrency,
  intercomNotificationsCount,
  appSettings,
  hasDBConflicts,
  backupStatus,
});

const mapDispatchToProps = (dispatch: Function) => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
  repairStorage: () => dispatch(repairStorageAction()),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  updateUser: (walletId: string, field: Object) => dispatch(updateUserAction(walletId, field)),
  updateAppSettings: (path: string, value: any) => dispatch(updateAppSettingsAction(path, value)),
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
