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

import React, { useCallback, type AbstractComponent } from 'react';
import { connect } from 'react-redux';
import { View, Image, Dimensions, Share, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';

// components
import { BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import WarningBanner from 'components/WarningBanner';
import QRCodeWithTheme from 'components/QRCode';
import { LabelBadge } from 'components/LabelBadge';
import Toast from 'components/Toast';
import ProfileImage from 'components/ProfileImage';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { getAccountEnsName } from 'utils/accounts';

// models and types
import type { Account } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// selectors
import { activeAccountSelector } from 'selectors';


const ContentWrapper = styled(SafeAreaView)`
  padding: 0 ${spacing.layoutSides}px 60px;
  align-items: center;
`;

type StateProps = {|
  user: User,
  activeAccount: ?Account,
|};

type OwnProps = {|
  address: string,
  handleBuyTokens?: Function,
  onModalHide?: Function,
  showBuyTokensButton?: boolean,
  showErc20Note?: boolean,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
|};

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const WalletAddress = styled(BaseText)`
  ${fontStyles.regular};
  margin: ${spacing.small}px 0;
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
  margin-top: ${spacing.medium}px;
  margin-bottom: ${spacing.medium}px;
  justify-content: space-between;
  width: 100%;
`;

const InfoView = styled.View`
  margin-bottom: ${spacing.medium}px;
  justify-content: space-between;
  width: 100%;
`;

const ImageWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const visaIcon = require('assets/icons/visa.png');
const mastercardIcon = require('assets/icons/mastercard.png');

const handleCopyToClipboard = (addressOrEnsName: string, ensCopy?: boolean) => {
  Clipboard.setString(addressOrEnsName);
  const message = ensCopy ? t('toast.ensNameCopiedToClipboard') : t('toast.addressCopiedToClipboard');
  Toast.show({ message, emoji: 'ok_hand' });
};

const ReceiveModal = ({
  activeAccount,
  address,
  handleBuyTokens,
  onModalHide,
  showBuyTokensButton = false,
  showErc20Note,
  user,
}: Props) => {
  const handleAddressShare = useCallback(() => {
    Share.share({ title: t('title.publicAddress'), message: address });
  }, [address]);

  const { profileImage, lastUpdateTime = 0, username = '' } = user;
  const ensName = getAccountEnsName(activeAccount);
  const needsSmallButtons = showBuyTokensButton && SCREEN_WIDTH < 300;
  const profileImageURI = profileImage ? `${profileImage}?t=${lastUpdateTime}` : null;

  return (
    <SlideModal
      onModalHide={onModalHide}
      noPadding
      noClose
      headerLeftItems={showErc20Note ? [{
        custom: (
          <LabelBadge
            label={t('label.erc20TokensOnly')}
            labelStyle={{ fontSize: fontSizes.tiny }}
            primary
          />
        ),
      }] : undefined}
      centerFloatingItem={
        <ImageWrapper style={{ position: 'absolute', marginTop: -24 }}>
          <ProfileImage
            uri={profileImageURI}
            userName={username}
            diameter={48}
          />
        </ImageWrapper>
      }
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <WarningBanner rounded small />
        {!!ensName && (
          <InfoView>
            <BaseText
              big
              onPress={() => handleCopyToClipboard(ensName, true)}
              center
            >
              {ensName}
            </BaseText>
            <BaseText regular center secondary>{t('label.yourEnsName')}</BaseText>
          </InfoView>
        )}
        <QRCodeWrapper>
          <View style={{ overflow: 'hidden', padding: 10 }}>
            {!!address && <QRCodeWithTheme value={address} size={160} />}
          </View>
          <WalletAddress onPress={() => handleCopyToClipboard(address)}>
            {address}
          </WalletAddress>
        </QRCodeWrapper>
        <ButtonsRow>
          {showBuyTokensButton && (
          <Button
            title={t('button.buyTokens')}
            onPress={handleBuyTokens}
            primarySecond
            small={needsSmallButtons}
            style={{ flex: 1, marginRight: 10 }}
          />
          )}
          <Button
            title={t('button.shareAddress')}
            onPress={handleAddressShare}
            small={needsSmallButtons}
            style={{ flex: 1 }}
          />
        </ButtonsRow>
        {showBuyTokensButton && (
        <IconsContainer>
          <Image source={visaIcon} />
          <IconsSpacing />
          <Image source={mastercardIcon} />
        </IconsContainer>
        )}
      </ContentWrapper>
    </SlideModal>
  );
};

const mapStateToProps = ({
  user: { data: user },
}: RootReducerState): $Shape<StateProps> => ({
  user,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<StateProps> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (connect(combinedMapStateToProps)(ReceiveModal): AbstractComponent<OwnProps>);
