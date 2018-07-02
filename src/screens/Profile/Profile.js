// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { Container, ScrollWrapper } from 'components/Layout';
import { Toast } from 'native-base';
import { Platform, Picker, View } from 'react-native';
import Modal from 'react-native-modal';
import t from 'tcomb-form-native';

import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import PortfolioBalance from 'components/PortfolioBalance';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import { saveBaseFiatCurrencyAction, changeRequestPinForTransactionAction } from 'actions/profileActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import ModalScreenHeader from 'components/ModalScreenHeader';
import IFrameModal from 'components/Modals/IFrameModal';

import ProfileHeader from './ProfileHeader';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileImage from './ProfileImage';
import SettingsPanel from './SettingsPanel';

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

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  saveBaseFiatCurrency: (currency: ?string) => Function,
  baseFiatCurrency: ?string,
  requestPinForTransaction: ?boolean,
  wallet: Object,
  intercomNotificationsCount: number,
  changeRequestPinForTransaction: (value: boolean) => Function,
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
  showSupportCenterModal: boolean,
}

const { Form } = t.form;
const SettingsInputString = t.struct({
  stringInput: t.String,
});

const formOptions = {
  fields: {
    stringInput: {
      config: {
        inputProps: {
          autoCapitalize: 'words',
        },
      },
      error: 'Please insert required information',
    },
  },
};

t.form.Form.stylesheet.textbox.normal.color = '#000000';
t.form.Form.stylesheet.textbox.normal.backgroundColor = '#ffffff';
t.form.Form.stylesheet.textbox.error.backgroundColor = '#ffffff';
t.form.Form.stylesheet.textbox.normal.borderRadius = 0;
t.form.Form.stylesheet.textbox.error.borderRadius = 0;

if (Platform.OS === 'android') {
  t.form.Form.stylesheet.textbox.normal.borderWidth = 0;
  t.form.Form.stylesheet.textbox.error.borderWidth = 0;
  t.form.Form.stylesheet.textbox.normal.borderRadius = 0;
  t.form.Form.stylesheet.textbox.error.borderRadius = 0;
  t.form.Form.stylesheet.textbox.normal.borderBottomWidth = 1;
  t.form.Form.stylesheet.textbox.error.borderBottomWidth = 1;
}


t.form.Form.stylesheet.controlLabel.normal.display = 'none';
t.form.Form.stylesheet.controlLabel.error.display = 'none';

class Profile extends React.Component<Props, State> {
  _form: t.form;

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
      showSupportCenterModal: false,
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

  handleSettingsChange = (property) => {
    const value = this._form.getValue();
    if (value) {
      switch (property) {
        case 'country':
          this.setState({ visibleModal: null });
          break;
        default:
          this.setState({ visibleModal: null });
      }
    }
  };

  onChange = (value) => {
    this.setState({ value });
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

  toggleSupportCenterModal = () => {
    this.setState({ showSupportCenterModal: !this.state.showSupportCenterModal });
  };

  render() {
    const { user, wallet, intercomNotificationsCount } = this.props;
    const {
      selectedCurrency,
      requestPinForTransaction,
      showCheckPinModal,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
      showSupportCenterModal,
    } = this.state;

    return (
      <Container>
        <Modal
          isVisible={this.state.visibleModal === 'country'}
          animationIn="fadeIn"
          animationOut="fadeOut"
          backdropOpacity={0.4}
          style={{ padding: 30 }}
        >
          <SettingsPanel
            panelTitle="Enter country"
            handleOK={() => this.handleSettingsChange('country')}
            handleCancel={() => this.setState({ visibleModal: null })}
            headerMarginIOS
          >
            <Form
              ref={node => { this._form = node; }}
              type={SettingsInputString}
              options={formOptions}
              value={this.state.value}
              onChange={this.onChange}
            />
          </SettingsPanel>
        </Modal>

        <Modal
          isVisible={this.state.visibleModal === 'city'}
          animationIn="fadeIn"
          animationOut="fadeOut"
          backdropOpacity={0.4}
          style={{ padding: 30 }}
        >
          <SettingsPanel
            panelTitle="Enter city name"
            handleOK={() => this.handleSettingsChange()}
            handleCancel={() => this.setState({ visibleModal: null })}
            headerMarginIOS
          >
            <Form
              ref={node => { this._form = node; }}
              type={SettingsInputString}
              options={formOptions}
              value={this.state.value}
              onChange={this.onChange}
            />
          </SettingsPanel>
        </Modal>

        <Modal
          isVisible={this.state.visibleModal === 'email'}
          animationIn="fadeIn"
          animationOut="fadeOut"
          backdropOpacity={0.4}
          style={{ padding: 30 }}
        >
          <SettingsPanel
            panelTitle="Enter email"
            handleOK={() => this.handleSettingsChange()}
            handleCancel={() => this.setState({ visibleModal: null })}
            headerMarginIOS
          >
            <Form
              ref={node => { this._form = node; }}
              type={SettingsInputString}
              options={formOptions}
              value={this.state.value}
              onChange={this.onChange}
            />
          </SettingsPanel>
        </Modal>

        <Modal
          isVisible={this.state.visibleModal === 'phone'}
          animationIn="fadeIn"
          animationOut="fadeOut"
          backdropOpacity={0.4}
          style={{ padding: 30 }}
        >
          <SettingsPanel
            panelTitle="Enter phone number"
            handleOK={() => this.handleSettingsChange()}
            handleCancel={() => this.setState({ visibleModal: null })}
            headerMarginIOS
          >
            <Form
              ref={node => { this._form = node; }}
              type={SettingsInputString}
              options={formOptions}
              value={this.state.value}
              onChange={this.onChange}
            />
          </SettingsPanel>
        </Modal>

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
              onPress={() =>
                this.setState({ visibleModal: 'country' })}
            />

            <ProfileSettingsItem
              key="city"
              label="City"
              value={user.city}
              onPress={() =>
                this.setState({ visibleModal: 'city' })}
            />

            <ProfileSettingsItem
              key="email"
              label="Email"
              value={user.email}
              onPress={() =>
                this.setState({ visibleModal: 'email' })}
            />

            <ProfileSettingsItem
              key="phone"
              label="Phone"
              value={user.phone}
              onPress={() =>
                this.setState({ visibleModal: 'phone' })}
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
              fullScreenComponent={(
                <Container>
                  <ModalScreenHeader onClose={this.handleCheckPinModalClose} />
                  <CheckPin onPinValid={() => this.handleChangeRequestPinForTransaction(!requestPinForTransaction)} />
                </Container>
              )}
            />

            <ListSeparator>
              <ListSeparatorText>About</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="termsOfUse"
              label="Terms of Use"
              onPress={this.toggleTermsConditionsModal}
            />

            <ProfileSettingsItem
              key="supportCenter"
              label="Support Center"
              onPress={() => Intercom.displayHelpCenter()}
            />

            <ProfileSettingsItem
              key="privacyPolicy"
              label="Privacy Policy"
              onPress={this.togglePrivacyPolicyModal}
            />

            <ProfileSettingsItem
              key="chat"
              label="Chat with us"
              notificationsCount={intercomNotificationsCount}
              onPress={() => Intercom.displayMessageComposer()}
            />

            <IFrameModal
              isVisible={showTermsConditionsModal}
              modalHide={this.toggleTermsConditionsModal}
              uri="https://pillarproject.io/en/legal/terms-of-use/"
            />

            <IFrameModal
              isVisible={showSupportCenterModal}
              modalHide={this.toggleSupportCenterModal}
              uri="https://help.pillarproject.io/getting-started-with-the-alpha-beta-wallet"
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
      </Container>
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
