// @flow
import * as React from 'react';
import { Clipboard, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode';
import { TextLink, Label } from 'components/Typography';
import { baseColors } from 'utils/variables';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';

const { height } = Dimensions.get('window');

const ContentWrapper = styled.View`
  height: ${height / 2};
  justify-content: space-around;
`;

type Props = {
  address: string,
  onModalHide: Function,
  handleOpenShareDialog: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
}

type State = {
  isVisible: boolean,
  address: string,
  onModalHide: Function,
  token: string,
  tokenName: string,
}

const FooterWrapper = styled.View`
  flexDirection: column;
  justify-content: space-around;
  align-items: center;
  padding: 0 10px;
  width: 100%;
`;

const TouchableOpacity = styled.TouchableOpacity`
  padding-top: 10px;
`;

const Holder = styled.View`
  display: flex;
  flex-direction:column;
  justify-content: space-around;
  align-items: center;
`;

const QRCodeWrapper = styled.View`
  display: flex;
  margin-bottom: 30px;
`;

export default class ReceiveModal extends React.Component<Props, State> {
  state = {
    isVisible: false,
    address: '',
    onModalHide: () => { },
    token: '',
    tokenName: '',
  }

  static getDerivedStateFromProps(props: Props) {
    return {
      isVisible: props.isVisible,
      address: props.address,
      onModalHide: props.onModalHide,
      token: props.token,
      tokenName: props.tokenName,
    };
  }

  handleAddressClipboardSet = () => {
    const {
      address,
    } = this.state;
    Clipboard.setString(address);
  };

  handleAddressShare = () => {
    const {
      handleOpenShareDialog,
      address,
    } = this.props;

    handleOpenShareDialog(address);
  };

  render() {
    const {
      isVisible,
      address,
      token,
      tokenName,
      onModalHide,
    } = this.state;

    return (
      <SlideModal
        title="receive"
        isVisible={isVisible}
        onModalHide={onModalHide}
        subtitle={`Share your wallet address to receive ${tokenName} (${token})`}
      >
        <WarningBanner rounded small />
        <ContentWrapper>
          <Holder>
            <QRCodeWrapper>
              <QRCode value={address} size={120} />
            </QRCodeWrapper>
            <Button
              title="Share Address"
              onPress={this.handleAddressShare}
              style={{
                marginBottom: 20,
              }}
            />
          </Holder>
          <Holder>
            <FooterWrapper>
              <Label color={baseColors.slateBlack}>{address}</Label>
              <TouchableOpacity onPress={this.handleAddressClipboardSet}>
                <TextLink>Copy wallet address to clipboard</TextLink>
              </TouchableOpacity>
            </FooterWrapper>
          </Holder>
        </ContentWrapper>
      </SlideModal>
    );
  }
}
