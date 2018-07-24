// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { Keyboard, KeyboardAvoidingView as RNKeyboardAvoidingView, Platform, View, StatusBar } from 'react-native';
import { Permissions } from 'expo';
import { SEND_TOKEN_AMOUNT } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { fontSizes, baseColors } from 'utils/variables';
import { Container } from 'components/Layout';
import { SubTitle } from 'components/Typography';
import { ButtonMini } from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Header from 'components/Header';
import ContactCard from 'components/ContactCard';
import ContactsSeparator from 'components/ContactsSeparator';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';

const PERMISSION_GRANTED = 'GRANTED';

type Props = {
  navigation: NavigationScreenProp<*>,
  localContacts: Object[],
}

type State = {
  isScanning: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
}

const statusBarHeight = Platform.OS === 'ios' ?
  20
  :
  StatusBar.currentHeight;


const qrCode = require('assets/images/qr.png');

// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Ethereum Address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'left',
    maxLength: 42,
    fontSize: fontSizes.medium,
    fontWeight: 300,
  };
  return (
    <SingleInput
      errorMessage={errorMessage}
      outterImageText="Scan"
      outterImageURI={qrCode}
      id="address"
      onPress={onIconPress}
      inputProps={inputProps}
    />
  );
}

const getFormStructure = () => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidETHAddress(address);
  });

  Address.getValidationErrorMessage = (address): string => {
    if (!isValidETHAddress(address)) {
      return 'Invalid Ethereum Address.';
    }
    return 'Address must be provided.';
  };

  return t.struct({
    address: Address,
  });
};

const generateFormOptions = (config: Object): Object => ({
  fields: {
    address: { template: AddressInputTemplate, config, label: 'To' },
  },
});

const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)`
  flex: 1;
  position: absolute;
  bottom: 40;
  left: 0;
  width: 100%;
`;

const FormWrapper = styled.View`
  padding: 0 16px;
`;

const FooterWrapper = Platform.OS === 'ios' ?
  styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  width: 100%;
` :
  styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0 16px;
  width: 100%;
  margin-bottom: 10px;
  margin-top: 10px;
`;

const ContactCardList = styled.FlatList`
  padding: 0 16px;
`;

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: { address: '' },
      formStructure: getFormStructure(),
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    if (!value) return;
    this.navigateToNextScreen(value.address);
  };

  handleQRScannerOpen = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      isScanning: status.toUpperCase() === PERMISSION_GRANTED,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRScannerClose = () => {
    this.setState({
      isScanning: false,
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false }, () => {
      this.navigateToNextScreen(address);
    });
  };

  renderContact = ({ item: user }) => {
    return (
      <ContactCard
        name={user.username}
        avatar={user.avatar}
        key={user.id}
        showActions
        noBorder
        onPress={() => this.setUsersEthAddress(user.ethAddress)}
      />
    );
  };

  setUsersEthAddress = (ethAddress: string) => {
    this.setState({ value: { ...this.state.value, address: ethAddress } }, () => {
      this.navigateToNextScreen(ethAddress);
    });
  };

  navigateToNextScreen(ethAddress) {
    this.props.navigation.navigate(SEND_TOKEN_AMOUNT, {
      assetData: this.assetData,
      receiver: ethAddress,
    });
  }

  render() {
    const {
      isScanning,
      formStructure,
      value,
    } = this.state;
    const formOptions = generateFormOptions(
      { onIconPress: this.handleQRScannerOpen },
    );

    const qrScannerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleQRScannerClose}
        onRead={this.handleQRRead}
      />
    );

    const { localContacts = [] } = this.props;
    const FormContent = (
      <React.Fragment>
        <FormWrapper>
          <SubTitle margin="0px">To whom you would like to send?</SubTitle>
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            onChange={this.handleChange}
            onBlur={this.handleChange}
            value={value}
          />
        </FormWrapper>
        <ContactCardList
          data={localContacts}
          renderItem={this.renderContact}
          keyExtractor={({ username }) => username}
          ItemSeparatorComponent={ContactsSeparator}
        />
      </React.Fragment>
    );

    const layout = Platform.OS === 'ios' ?
      (
        <Container>
          <Header
            onClose={this.props.navigation.dismiss}
            onCloseText="step 1 of 3"
            title="send"
            index={1}
          />
          {FormContent}
          {qrScannerComponent}
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={30}>
            {!!value.address.length &&
            <FooterWrapper>
              <ButtonMini title="Next" onPress={this.handleFormSubmit} />
            </FooterWrapper>
            }
          </KeyboardAvoidingView>
        </Container>
      ) :
      (
        <Container>
          <Header
            onClose={this.props.navigation.dismiss}
            onCloseText="step 1 of 3"
            title="send"
            index={1}
          />
          {FormContent}
          {!!value.address.length &&
          <FooterWrapper>
            <ButtonMini title="Next" onPress={this.handleFormSubmit} />
          </FooterWrapper>
          }
          {qrScannerComponent}
        </Container>
      );
    return (
      <View style={{ paddingTop: statusBarHeight, backgroundColor: baseColors.white }}>
        {layout}
      </View>
    );
  }
}

const mapStateToProps = ({ contacts: { data: localContacts } }) => ({
  localContacts,
});

export default connect(mapStateToProps)(SendTokenContacts);
