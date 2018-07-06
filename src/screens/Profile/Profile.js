// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { Toast, ListItem, Left, Right, Icon } from 'native-base';
import { Platform, Picker, View, FlatList } from 'react-native';
import Modal from 'react-native-modal';

import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import PortfolioBalance from 'components/PortfolioBalance';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import { saveBaseFiatCurrencyAction, changeRequestPinForTransactionAction } from 'actions/profileActions';
import { updateUserAction } from 'actions/userActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import IFrameModal from 'components/Modals/IFrameModal';

import countries from 'utils/countries.json';

import ProfileHeader from './ProfileHeader';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileImage from './ProfileImage';
import SettingsPanel from './SettingsPanel';
import ProfileForm from './ProfileForm';


const storage = new Storage('db');

const ProfileName = styled.Text`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold}
`;

const ListWrapper = styled.View`
  padding-bottom: 40px;
  background-color: ${baseColors.lighterGray};
`;


const FlexRowSpaced = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ListSeparator = styled.View`
  padding: 5px 30px 15px 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
  background-color: ${baseColors.lighterGray};
`;

const ListSeparatorText = styled.Text`
  margin-top: 30px;
  color: ${props => props.lastSynced ? baseColors.freshEucalyptus : baseColors.darkGray};
  text-align: ${props => props.lastSynced ? 'center' : 'left'};
  font-size: ${fontSizes.small};
`;

const CheckPinModal = styled(SlideModal)`
  align-items: flex-start;
`;

const ListValue = styled.Text`
  font-size: ${fontSizes.small};
  padding-left: 20px;
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
  type: 'string',
  config: { placeholder: 'user@example.com', autoCapitalize: 'none' },
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
  selectedCurrency: ?string,
  requestPinForTransaction: ?boolean,
  showCheckPinModal: boolean,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
}

class Profile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { requestPinForTransaction = true } = props;
    this.state = {
      visibleModal: null,
      value: {},
      selectedCurrency: props.baseFiatCurrency || defaultFiatCurrency,
      requestPinForTransaction,
      showCheckPinModal: false,
      showTermsConditionsModal: false,
      showPrivacyPolicyModal: false,
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

  onCurrencyChanged = (value?: string) => {
    if (value) {
      this.setState({
        selectedCurrency: value,
      });
    } else {
      this.props.saveBaseFiatCurrency(this.state.selectedCurrency);
      this.setState({
        visibleModal: null,
      });
    }
  };

  clearLocalStorage() {
    storage.removeAll();
    Toast.show({
      text: 'Cleared',
      buttonText: '',
    });
  }


  toggleSlideModalOpen = (visibleModal: ?string) => {
    this.setState({
      visibleModal,
    });
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

  renderListItem = ({ item: { name } }: Object) => {
    return (
      <ListItem key={name} onPress={() => this.handleUserFieldUpdate({ country: name })}>
        <Left>
          <ListValue>{name}</ListValue>
        </Left>
        <Right>
          <Icon
            name="chevron-right"
            type="Feather"
            style={{
              fontSize: 22,
              color: baseColors.coolGrey,
            }}
          />
        </Right>
      </ListItem>
    );
  }

  render() {
    const { user, wallet, intercomNotificationsCount } = this.props;
    const {
      selectedCurrency,
      requestPinForTransaction,
      showCheckPinModal,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
    } = this.state;
    return (
      <Container>
        <SlideModal
          isVisible={this.state.visibleModal === 'country'}
          title="personal details"
          subtitle="Choose your country"
          fullScreen
          onModalHide={() => this.toggleSlideModalOpen(null)}
        >
          <FlatList
            data={countries}
            renderItem={this.renderListItem}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>
        <SlideModal
          isVisible={this.state.visibleModal === 'city'}
          title="personal details"
          subtitle="Enter city name"
          fullScreen
          onModalHide={() => this.toggleSlideModalOpen(null)}
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
          onModalHide={() => this.toggleSlideModalOpen(null)}
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
          onModalHide={() => this.toggleSlideModalOpen(null)}
        >
          <Wrapper regularPadding>
            <ProfileForm
              fields={fullNameFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ firstName: user.firstName, lastName: user.lastName }}
            />
          </Wrapper>
        </SlideModal>
        <Modal
          isVisible={this.state.visibleModal === 'baseCurrency'}
          animationIn="fadeIn"
          animationOut="fadeOut"
          backdropOpacity={0.4}
          style={{ padding: 30 }}
        >
          <SettingsPanel
            panelTitle="Pick the base currency"
            handleOK={() => this.onCurrencyChanged()}
            handleCancel={() => this.setState({ visibleModal: null })}
          >
            <View style={{
              paddingBottom: 10,
              paddingTop: 10,
              display: 'flex',
              alignItems: 'center',
            }}
            >
              <Picker
                selectedValue={selectedCurrency}
                style={{
                  ...Platform.select({
                    ios: {
                      height: 180,
                    },
                    android: {
                      height: 50,
                    },
                  }),
                  width: '100%',
                }}
                onValueChange={(itemValue) => this.onCurrencyChanged(itemValue)}
              >
                {supportedFiatCurrencies.map(el => <Picker.Item label={el} value={el} key={el} />)}
              </Picker>
            </View>
          </SettingsPanel>
        </Modal>

        <ScrollWrapper>
          <ProfileHeader>
            <FlexRowSpaced>
              <ProfileName>{user.username}</ProfileName>
              <ProfileImage uri={user.profileImage} userName={user.username} />
            </FlexRowSpaced>
            <PortfolioBalance />
          </ProfileHeader>

          <ListWrapper>
            <ListSeparator>
              <ListSeparatorText>PROFILE SETTINGS</ListSeparatorText>
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
              <ListSeparatorText>GENERAL SETTINGS</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="baseCurrency"
              label="Base currency"
              value={selectedCurrency}
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

            <CheckPinModal
              isVisible={showCheckPinModal}
              title="confirm"
              onClose={this.handleCheckPinModalClose}
              fullScreen
            >
              <CheckPin onPinValid={() => this.handleChangeRequestPinForTransaction(!requestPinForTransaction)} />
            </CheckPinModal>

            <ListSeparator>
              <ListSeparatorText>ABOUT</ListSeparatorText>
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

            <ListSeparator>
              <ListSeparatorText>DEBUG</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="clearStorage"
              label="Clear Local Storage"
              onPress={() => { this.clearLocalStorage(); }}
            />
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
