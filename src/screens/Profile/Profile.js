// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { baseColors, fontSizes } from 'utils/variables';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { Toast, ListItem as NBListItem, Left, Right, Icon } from 'native-base';
import { FlatList } from 'react-native';

import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import { supportedFiatCurrencies } from 'constants/assetsConstants';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import { SubHeading } from 'components/Typography';
import { saveBaseFiatCurrencyAction, changeRequestPinForTransactionAction } from 'actions/profileActions';
import { updateUserAction } from 'actions/userActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import IFrameModal from 'components/Modals/IFrameModal';
import SystemInfoModal from 'components/SystemInfoModal';

import countries from 'utils/countries.json';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileForm from './ProfileForm';

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency }));
const storage = new Storage('db');

const ListWrapper = styled.View`
  padding-bottom: 40px;
  background-color: ${baseColors.lighterGray};
`;

const ListSeparator = styled.View`
  padding: 20px 16px;
  border-top-width: ${props => props.first ? 0 : '1px'};
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
  background-color: ${baseColors.lighterGray};
`;

const ListValue = styled.Text`
  font-size: ${fontSizes.small};
  padding-left: 20px;
`;

const ListItem = styled(NBListItem)`
  margin: 5px 0;
`;

const ListIcon = styled(Icon)`
  fontSize: 22px;
  color: ${baseColors.coolGrey};
`;

const cityFormFields = [{
  label: 'City',
  name: 'city',
  type: 'string',
  config: { placeholder: 'London' },
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
  type: 'string',
  config: { placeholder: 'First name' },
}, {
  label: 'Last name',
  name: 'lastName',
  type: 'string',
  config: { placeholder: 'Last name' },
}];

const CheckPinWrapper = styled.View`
  display: flex;
  height: 100%;
`;

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
}

type State = {
  visibleModal: string | null,
  value: Object,
  requestPinForTransaction: ?boolean,
  showCheckPinModal: boolean,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
  showSystemInfoModal: boolean,
}

class Profile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { requestPinForTransaction = true } = props;
    this.state = {
      visibleModal: null,
      value: {},
      requestPinForTransaction,
      showCheckPinModal: false,
      showTermsConditionsModal: false,
      showPrivacyPolicyModal: false,
      showSystemInfoModal: false,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { requestPinForTransaction } = nextProps;
    if (requestPinForTransaction !== undefined && requestPinForTransaction !== prevState.requestPinForTransaction) {
      return {
        ...prevState,
        requestPinForTransaction,
      };
    }
    return null;
  }

  clearLocalStorage() {
    storage.removeAll();
    Toast.show({
      text: 'Cleared',
      buttonText: '',
    });
  }

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({
      visibleModal,
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

  renderListItem = (field: string, onSelect: Function) => ({ item: { name } }: Object) => {
    return (
      <ListItem key={name} onPress={() => onSelect({ [field]: name })}>
        <Left>
          <ListValue>{name}</ListValue>
        </Left>
        <Right>
          <ListIcon
            name="chevron-right"
            type="Feather"
          />
        </Right>
      </ListItem>
    );
  }

  render() {
    const {
      user,
      wallet,
      intercomNotificationsCount,
      baseFiatCurrency,
      navigation,
    } = this.props;
    const {
      requestPinForTransaction,
      showCheckPinModal,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSystemInfoModal,
    } = this.state;
    return (
      <Container color={baseColors.snowWhite}>
        <Header gray title="settings" onBack={navigation.goBack} index={1} />
        <SlideModal
          isVisible={this.state.visibleModal === 'country'}
          title="personal details"
          subtitle="Choose your country"
          fullScreen
          onModalHide={this.toggleSlideModalOpen}
        >
          <FlatList
            data={countries}
            renderItem={this.renderListItem('country', this.handleUserFieldUpdate)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'city'}
          title="personal details"
          subtitle="Enter city name"
          fullScreen
          onModalHide={this.toggleSlideModalOpen}
        >
          <Wrapper regularPadding>
            <ProfileForm
              fields={cityFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ city: user.city }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'email'}
          title="personal details"
          subtitle="Enter your email"
          fullScreen
          onModalHide={this.toggleSlideModalOpen}
        >
          <Wrapper regularPadding>
            <ProfileForm
              fields={emailFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ email: user.email }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'fullName'}
          title="personal details"
          subtitle="Enter your full name"
          fullScreen
          onModalHide={this.toggleSlideModalOpen}
        >
          <Wrapper regularPadding>
            <ProfileForm
              fields={fullNameFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ firstName: user.firstName, lastName: user.lastName }}
            />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'baseCurrency'}
          title="preferences"
          subtitle="Choose your base currency"
          fullScreen
          onModalHide={this.toggleSlideModalOpen}
        >
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
              value={baseFiatCurrency}
              onPress={() =>
                this.setState({ visibleModal: 'baseCurrency' })}
            />

            {wallet.mnemonic && (<ProfileSettingsItem
              key="backupWallet"
              label="Backup wallet"
              onPress={() => this.props.navigation.navigate(REVEAL_BACKUP_PHRASE)}
            />)}

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
              fullScreen
            >
              <Container>
                <CheckPinWrapper>
                  <CheckPin onPinValid={() => this.handleChangeRequestPinForTransaction(!requestPinForTransaction)} />
                </CheckPinWrapper>
              </Container>
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
              <SubHeading>SYSTEM INFO</SubHeading>
            </ListSeparator>

            <ProfileSettingsItem
              key="systemInfo"
              label="System Info"
              onPress={() => this.setState({ showSystemInfoModal: true })}
            />

            <SlideModal
              isVisible={showSystemInfoModal}
              fullScreen
              onModalHide={() => this.setState({ showSystemInfoModal: false })}
            >
              <Container>
                <Wrapper regularPadding>
                  <SystemInfoModal />
                </Wrapper>
              </Container>
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
