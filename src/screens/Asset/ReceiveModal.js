// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Clipboard } from 'react-native';
import QRCode from 'react-native-qrcode';
import { TextLink, BaseText } from 'components/Typography';
import { Footer } from 'components/Layout';
import { spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';
import Toast from 'components/Toast';

const ContentWrapper = styled.View`
  height: 300;
  justify-content: flex-start;
`;

type Props = {
  address: string,
  onModalHide: Function,
  handleOpenShareDialog: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
}

const CopyAddressLink = styled.TouchableOpacity`
  margin-top: ${spacing.rhythm}px;
  margin-bottom: ${spacing.rhythm}px;
  align-items: center;
`;

const QRCodeWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const WalletAddress = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

export default class ReceiveModal extends React.Component<Props, *> {
  handleAddressClipboardSet = () => {
    const {
      address,
    } = this.props;
    Clipboard.setString(address);
    Toast.show({ message: 'Address copied to clipboard', type: 'success', title: 'Success' });
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
      onModalHide,
    } = this.props;
    return (
      <SlideModal
        title="receive"
        isVisible={isVisible}
        onModalHide={onModalHide}
      >
        <WarningBanner rounded small />
        <ContentWrapper>
          <QRCodeWrapper>
            <QRCode value={address} size={160} />
            <CopyAddressLink onPress={this.handleAddressClipboardSet}>
              <TextLink>Copy wallet address to clipboard</TextLink>
            </CopyAddressLink>

            <WalletAddress>{address}</WalletAddress>
          </QRCodeWrapper>
        </ContentWrapper>
        <Footer>
          <Button
            title="Share Address"
            onPress={this.handleAddressShare}
            style={{
              marginBottom: 20,
            }}
          />
        </Footer>
      </SlideModal>
    );
  }
}
