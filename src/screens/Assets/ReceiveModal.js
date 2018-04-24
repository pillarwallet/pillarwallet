// @flow
import * as React from 'react';
import { Share, Clipboard } from 'react-native';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCode from 'components/QRCode';

type Props = {
  address: string,
  isVisible: boolean,
  onDismiss: Function
}

const Container = styled.View`
  flex: 1;
  justifyContent: space-around;
  flexDirection: column;
  alignItems: center;
  padding: 20px;
`;

const Copy = styled.Text`
  color: #2077FD; 
  textAlign: center;
  marginTop: 10;
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
    const { address, isVisible, onDismiss } = this.props;
    return (
      <SlideModal title="receive." isVisible={isVisible} onDismiss={onDismiss}>
        <Container>
          <QRCode value={address} blockHeight={5} />
          <Address>{address}</Address>
          <Copy onPress={this.handleAddressClipboardSet}>Copy address</Copy>
          <Button title="Share your address" onPress={this.handleAddressShare} />
        </Container>
      </SlideModal>
    );
  }
}
