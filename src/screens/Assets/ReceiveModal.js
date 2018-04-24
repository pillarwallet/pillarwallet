// @flow
import * as React from 'react';
import { Text, Share, Clipboard } from 'react-native';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCode from 'components/QRCode';

type Props = {
  address: string,
  token: string,
  tokenName: string,
  isVisible: boolean,
  onDismiss: Function
}

const Container = styled.View`
  flex: ${props => props.flex};
  justifyContent: center;
  flexDirection: column;
  alignItems: center;
`;

const Address = styled.Text`
  fontSize: 11px;
`;

export default class ReceiveModal extends React.Component<Props> {
  handleAddressClipboardSet = () => {
    const { address } = this.props;
    Clipboard.setString(address);
  };

  handleAddressShare = () => {
    const { address } = this.props;
    Share.share({ title: 'Public address', message: address });
  }

  render() {
    const {
      address, isVisible, onDismiss, token, tokenName,
    } = this.props;
    return (
      <SlideModal title="receive." isVisible={isVisible} onDismiss={onDismiss}>
        <Container flex={4}>
          <QRCode value={address} blockHeight={5} />
          <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>
              This is your ROPSTEN {tokenName} address, use for transfering ROPSTEN {token} only!
          </Text>
        </Container>
        <Container flex={1}>
          <Address>{address}</Address>
          <Button secondary title="Copy Address" onPress={this.handleAddressClipboardSet} />
        </Container>
        <Container flex={3}>
          <Button title="Share Address" onPress={this.handleAddressShare} />
        </Container>
      </SlideModal>
    );
  }
}
