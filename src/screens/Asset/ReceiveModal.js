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
import { View, Image, Dimensions } from 'react-native';
import { BaseText } from 'components/Typography';
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';
import QRCodeWithTheme from 'components/QRCode';
import { LabelBadge } from 'components/LabelBadge';

const ContentWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px ${spacing.large}px;
  align-items: center;
`;

type Props = {
  address: string,
  onModalHide: Function,
  handleOpenShareDialog: Function,
  token: string,
  tokenName: string,
  isVisible: boolean,
  handleBuyTokens?: Function,
  onModalHidden?: Function,
  showBuyTokensButton?: boolean,
  showErc20Note?: boolean,
};

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const WalletAddress = styled(BaseText)`
  ${fontStyles.regular};
  margin: ${spacing.mediumLarge}px 0;
`;

const IconsContainer = styled.View`
  flex-direction: row;
  margin: 0 ${spacing.layoutSides}px;
  justify-content: center;
`;

const IconsSpacing = styled.View`
  width: ${spacing.small}px;
`;

const ButtonsRow = styled.View`
  flex-direction: row;
  margin-top: 40px;
  margin-bottom: ${spacing.large}px;
  justify-content: space-between;
  width: 100%;
`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getButtonWidth = () => {
  return (SCREEN_WIDTH / 2) - (spacing.layoutSides * 1.5);
};

const visaIcon = require('assets/icons/visa.png');
const mastercardIcon = require('assets/icons/mastercard.png');

export default class ReceiveModal extends React.Component<Props, *> {
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
      handleBuyTokens,
      onModalHidden,
      showBuyTokensButton = false,
      showErc20Note,
    } = this.props;

    const buttonWidth = showBuyTokensButton ? getButtonWidth() : 0;
    const needsSmallButtons = showBuyTokensButton && buttonWidth <= 150;

    return (
      <SlideModal
        title="Receive"
        isVisible={isVisible}
        onModalHide={onModalHide}
        onModalHidden={onModalHidden}
        noPadding
        headerLeftItems={!!showErc20Note && [{
          custom: (
            <LabelBadge
              label="ERC-20 tokens only"
              labelStyle={{ fontSize: fontSizes.tiny }}
              primary
              containerStyle={{ marginLeft: 8 }}
            />
          ),
        }]}
      >
        <ContentWrapper>
          <WarningBanner rounded small />
          <QRCodeWrapper>
            <WalletAddress>{address}</WalletAddress>
            <View
              style={{
                overflow: 'hidden',
                padding: 10,
              }}
            >
              <QRCodeWithTheme value={address} size={160} />
            </View>
          </QRCodeWrapper>
          <ButtonsRow>
            {showBuyTokensButton && (
              <Button
                title="Buy tokens"
                onPress={handleBuyTokens}
                positive
                width={buttonWidth}
                small={needsSmallButtons}
              />
            )}
            <Button
              title="Share Address"
              onPress={this.handleAddressShare}
              width={buttonWidth}
              small={needsSmallButtons}
              block={!buttonWidth}
            />
          </ButtonsRow>
          {showBuyTokensButton && (
          <IconsContainer>
            <Image source={visaIcon} />
            <IconsSpacing />
            <Image source={mastercardIcon} />
          </IconsContainer>
          }
        </ContentWrapper>
      </SlideModal>
    );
  }
}
