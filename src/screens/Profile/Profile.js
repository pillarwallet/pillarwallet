// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { Container, ScrollWrapper } from 'components/Layout';
import { Toast } from 'native-base';
import { Platform, Picker, View } from 'react-native';
import Modal from 'react-native-modal';
import t from 'tcomb-form-native';

import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import PortfolioBalance from 'components/PortfolioBalance';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';

import { saveBaseFiatCurrencyAction } from 'actions/profileActions';
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
  color: ${props => props.lastSynced ? baseColors.lightGreen : baseColors.darkGray};
  text-align: ${props => props.lastSynced ? 'center' : 'left'};
  font-size: ${fontSizes.small};
`;

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  saveBaseFiatCurrency: (currency: string) => Function,
}

type State = {
  visibleModal: string | null,
  value: Object,
  selectedCurrency: string,
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
    this.state = {
      visibleModal: null,
      value: {},
      selectedCurrency: props.baseFiatCurrency || defaultFiatCurrency,
    };
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

  handleSettingsChange = () => {
    const value = this._form.getValue();
    if (value) {
      this.setState({ visibleModal: null });
    }
  };

  onChange = (value) => {
    this.setState({ value });
  };

  render() {
    const { user } = this.props;
    const { selectedCurrency } = this.state;

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
              <ProfileName>{`${user.firstName} ${user.lastName}`}</ProfileName>
              <ProfileImage uri={user.profileImage} userName={`${user.firstName} ${user.lastName}`} />
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

            <ProfileSettingsItem
              key="backupWallet"
              label="Backup wallet"
              onPress={() => this.props.navigation.navigate(REVEAL_BACKUP_PHRASE)}
            />

            <ProfileSettingsItem
              key="changePin"
              label="Change PIN"
              onPress={() => this.props.navigation.navigate(CHANGE_PIN_FLOW)}
            />

            <ProfileSettingsItem
              key="requestPin"
              label="Request PIN for transaction"
              value={1}
              toggle
              onPress={null}
            />

            <ListSeparator />

            <ProfileSettingsItem
              key="aboutWallet"
              label="About Pillar wallet"
              onPress={null}
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
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  user,
  baseFiatCurrency,
});

// const mapStateToProps = ({
//   user: { data: user },
//   wallet: { data: wallet },
//   appSettings: { data: { baseFiatCurrency } },
// }) => ({
//   user,
//   wallet,
//   baseFiatCurrency,
// });

const mapDispatchToProps = (dispatch: Function) => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
