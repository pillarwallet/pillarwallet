// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import ChatService from 'services/chat';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { baseColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { FlatList } from 'react-native';
import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import { SubHeading, BoldText } from 'components/Typography';
import { saveBaseFiatCurrencyAction, changeRequestPinForTransactionAction } from 'actions/profileActions';
import { updateUserAction } from 'actions/userActions';
import { resetIncorrectPasswordAction, lockScreenAction } from 'actions/authActions';
import IFrameModal from 'components/Modals/IFrameModal';
import SystemInfoModal from 'components/SystemInfoModal';
import Toast from 'components/Toast';
import SearchBar from 'components/SearchBar';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

import countries from 'utils/countries.json';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileForm from './ProfileForm';

const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));
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

const SearchBarWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

const SettingsModalTitle = styled(BoldText)`
  line-height: ${fontSizes.medium};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
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
  requestPinForTransaction: ?boolean,
  wallet: Object,
  intercomNotificationsCount: number,
  changeRequestPinForTransaction: (value: boolean) => Function,
  updateUser: (walletId: string, field: Object) => Function,
  resetIncorrectPassword: () => Function,
  lockScreen: () => Function,
}

type State = {
  visibleModal: string | null,
  requestPinForTransaction: ?boolean,
  showCheckPinModal: boolean,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
  showSystemInfoModal: boolean,
  query: string,
  filteredCountries: any,
}

class Profile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { requestPinForTransaction = true } = props;
    this.state = {
      visibleModal: null,
      requestPinForTransaction,
      showCheckPinModal: false,
      showTermsConditionsModal: false,
      showPrivacyPolicyModal: false,
      showSystemInfoModal: false,
      query: '',
      filteredCountries: null,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.requestPinForTransaction !== this.props.requestPinForTransaction) {
      this.setState({ requestPinForTransaction: this.props.requestPinForTransaction }); // eslint-disable-line
    }
  }

  clearLocalStorage() {
    storage.removeAll();
    chat.client.resetAccount().catch(() => null);
    Toast.show({ title: 'Success', type: 'success', message: 'Local storage was cleared' });
  }

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({
      visibleModal,
      query: '',
      filteredCountries: null,
    });
  };

  toggleTermsConditionsModal = () => {
    this.setState({ showTermsConditionsModal: !this.state.showTermsConditionsModal });
  };

  togglePrivacyPolicyModal = () => {
    this.setState({ showPrivacyPolicyModal: !this.state.showPrivacyPolicyModal });
  };

  handleChangeRequestPinForTransaction = (value) => {
    const { changeRequestPinForTransaction } = this.props;
    changeRequestPinForTransaction(value);
    this.setState({
      requestPinForTransaction: !this.state.requestPinForTransaction,
      showCheckPinModal: false,
    });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
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

  handleSearchChange = (query: any) => {
    this.setState({ query });
    this.handleCountrySearch(query);
  };

  handleCountrySearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < 2) {
      this.setState({ filteredCountries: null });
      return;
    }
    const filteredCountries =
      sortedCountries.filter(country => country.name.toUpperCase().includes(query.toUpperCase()));
    this.setState({ filteredCountries });
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

  render() {
    const {
      user,
      wallet,
      intercomNotificationsCount,
      baseFiatCurrency,
      navigation,
      lockScreen,
    } = this.props;

    const {
      requestPinForTransaction,
      showCheckPinModal,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSystemInfoModal,
      query,
      filteredCountries,
    } = this.state;

    return (
      <Container color={baseColors.snowWhite}>
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
            <SearchBarWrapper>
              <SearchBar
                inputProps={{
                  onChange: this.handleSearchChange,
                  value: query,
                  autoCapitalize: 'none',
                }}
                placeholder="Search"
                backgroundColor={baseColors.white}
              />
            </SearchBarWrapper>
            <FlatList
              data={filteredCountries || sortedCountries}
              extraData={filteredCountries}
              renderItem={this.renderListItem('country', this.handleUserFieldUpdate)}
              keyExtractor={({ name }) => name}
              ListEmptyComponent={
                <Wrapper
                  fullScreen
                  style={{
                    paddingTop: 90,
                    paddingBottom: 90,
                    alignItems: 'center',
                  }}
                >
                  <EmptyStateParagraph title="Nothing found" bodyText="Make sure you entered the country correctly" />
                </Wrapper>
              }
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'city'}
          fullScreen
          showHeader
          onModalHide={this.toggleSlideModalOpen}
          backgroundColor={baseColors.lightGray}
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
          backgroundColor={baseColors.lightGray}
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
          backgroundColor={baseColors.lightGray}
          avoidKeyboard
        >
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your full name
            </SettingsModalTitle>
            <ProfileForm
              fields={fullNameFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ firstName: user.firstName, lastName: user.lastName }}
            />
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

            {wallet.mnemonic &&
              <ProfileSettingsItem
                key="backupWallet"
                label="Reveal backup phrase"
                onPress={() => this.props.navigation.navigate(REVEAL_BACKUP_PHRASE)}
              />
            }

            <ProfileSettingsItem
              key="changePin"
              label="Change PIN"
              onPress={() => this.props.navigation.navigate(CHANGE_PIN_FLOW)}
            />

            <ProfileSettingsItem
              key="requestPin"
              label="Request PIN for transaction"
              value={requestPinForTransaction}
              toggle
              onPress={() => this.setState({ showCheckPinModal: true })}
            />

            <SlideModal
              isVisible={showCheckPinModal}
              onModalHide={this.handleCheckPinModalClose}
              title="enter pincode"
              centerTitle
              fullScreen
              showHeader
            >
              <Wrapper flex={1}>
                <CheckPin onPinValid={() => this.handleChangeRequestPinForTransaction(!requestPinForTransaction)} />
              </Wrapper>
            </SlideModal>

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
              key="supportCenter"
              label="Support Center"
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

            <IFrameModal
              isVisible={showTermsConditionsModal}
              modalHide={this.toggleTermsConditionsModal}
              uri="https://pillarproject.io/en/legal/terms-of-use/"
            />

            <IFrameModal
              isVisible={showPrivacyPolicyModal}
              modalHide={this.togglePrivacyPolicyModal}
              uri="https://pillarproject.io/en/legal/privacy/"
            />


            {!!__DEV__ && (
              <React.Fragment>
                <ListSeparator>
                  <SubHeading>DEBUG</SubHeading>
                </ListSeparator>

                <ProfileSettingsItem
                  key="clearStorage"
                  label="Clear Local Storage"
                  onPress={() => { this.clearLocalStorage(); }}
                />
              </React.Fragment>
            )}

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
      </Container >
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  wallet: { data: wallet },
  appSettings: { data: { requestPinForTransaction, baseFiatCurrency } },
  notifications: { intercomNotificationsCount },
}) => ({
  user,
  wallet,
  requestPinForTransaction,
  baseFiatCurrency,
  intercomNotificationsCount,
});

const mapDispatchToProps = (dispatch: Function) => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
  changeRequestPinForTransaction: (value) => {
    dispatch(changeRequestPinForTransactionAction(value));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  updateUser: (walletId: string, field: Object) => dispatch(updateUserAction(walletId, field)),
  lockScreen: () => dispatch(lockScreenAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
