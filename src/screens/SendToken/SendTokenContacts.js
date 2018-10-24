// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import Separator from 'components/Separator';
import { SEND_TOKEN_AMOUNT, CONTACT } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { fontSizes, spacing } from 'utils/variables';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Header from 'components/Header';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  localContacts: Object[],
  wallet: Object,
};

type State = {
  isScanning: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
};

const qrCode = require('assets/images/qr.png');

const FormWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

const ContactCardList = styled.FlatList``;

// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Recipient Address',
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
      fontSize={fontSizes.medium}
    />
  );
}

const getFormStructure = (ownAddress: string) => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidETHAddress(address) && ownAddress !== address;
  });

  Address.getValidationErrorMessage = (address): string => {
    if (ownAddress === address) {
      return 'You are not allowed to make transaction to yourself';
    }
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

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: { address: '' },
      formStructure: getFormStructure(this.props.wallet.address),
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
    this.setState({
      isScanning: !this.state.isScanning,
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
    const { navigation } = this.props;
    return (
      <ListItemWithImage
        onPress={() => this.setUsersEthAddress(user.ethAddress)}
        label={user.username}
        avatarUrl={user.profileImage}
        navigateToProfile={() => navigation.navigate(CONTACT, { contact: user })}
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
    const { localContacts = [] } = this.props;
    const { isScanning, formStructure, value } = this.state;

    const formOptions = generateFormOptions({ onIconPress: this.handleQRScannerOpen });

    return (
      <Container>
        <Header onBack={this.props.navigation.dismiss} title={`send ${this.assetData.token}`} centerTitle />
        <FormWrapper>
          <Form
            ref={node => {
              this._form = node;
            }}
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
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        />
        <QRCodeScanner
          validator={ETHValidator}
          dataFormatter={decodeETHAddress}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
        <Footer keyboardVerticalOffset={35}>
          <Button flexRight small disabled={!value.address.length} title="Next" onPress={this.handleFormSubmit} />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: localContacts },
  wallet: { data: wallet },
}) => ({
  localContacts,
  wallet,
});

export default connect(mapStateToProps)(SendTokenContacts);
