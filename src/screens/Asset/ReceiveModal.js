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
import { Share, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';
import { useNavigation } from 'react-navigation-hooks';
import AutoScaleText from 'react-native-auto-scale-text';

// components
import Text from 'components/modern/Text';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCodeWithTheme from 'components/QRCode';
import Toast from 'components/Toast';
import ProfileImage from 'components/ProfileImage';
import TextWithCopy from 'components/modern/TextWithCopy';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { getAccountEnsName } from 'utils/accounts';
import { getThemeColors } from 'utils/themes';

// models and types
import type { Account } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';
import type { Theme } from 'models/Theme';

// selectors
import { activeAccountSelector } from 'selectors';

// Constants
import {
  ETHERSPOT_DEPLOYMENT_INTERJECTION,
} from 'constants/navigationConstants';

type StateProps = {|
  user: User,
  activeAccount: ?Account,
|};

type OwnProps = {|
  address: string,
  onModalHide?: Function,
  showErc20Note?: boolean,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  theme: Theme,
|};

const handleCopyToClipboard = (addressName: string) => {
  Clipboard.setString(addressName);
  Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
};

const ReceiveModal = ({
  activeAccount,
  address,
  onModalHide,
  user,
  theme,
}: Props) => {
  const handleAddressShare = useCallback(() => {
    Share.share({ title: t('title.publicAddress'), message: address });
  }, [address]);

  const colors = getThemeColors(theme);
  const navigation = useNavigation();

  const { username } = user;
  const ensName = getAccountEnsName(activeAccount);

  return (
    <SlideModal
      onModalHide={onModalHide}
      noPadding
      noClose
      // TODO : The label itself will be revisited later on the direction of the product team
      // headerLeftItems={showErc20Note ? [{
      //   custom: (
      //     <LabelBadge
      //       label={t('label.erc20TokensOnly')}
      //       labelStyle={{ fontSize: fontSizes.tiny }}
      //       primary
      //     />
      //   ),
      // }] : undefined}
      centerFloatingItem={
        <ImageWrapper style={{ position: 'absolute', marginTop: -24 }}>
          <ProfileImage userName={username} diameter={48} />
        </ImageWrapper>
      }
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <InfoView>
          {!!ensName && (
            <TextWithCopy
              textToCopy={ensName}
              toastText={t('toast.ensNameCopiedToClipboard')}
              iconColor={colors.link}
              textStyle={{ fontSize: fontSizes.big }}
            >
              {ensName}
            </TextWithCopy>
          )}
          {ensName ? (
            <WalletAddress maxLines={1} maxFontSize={fontSizes.regular}>
              {address}
            </WalletAddress>
          ) : (
            <TextWithCopy
              toastText={t('toast.addressCopiedToClipboard')}
              textToCopy={address}
              textStyle={{ color: colors.basic030, fontSize: fontSizes.regular }}
              iconColor={colors.link}
            >
              {address}
            </TextWithCopy>
          )}
        </InfoView>
        {!!address && (
          <QRCodeWrapper>
            <QRCodeWithTheme value={address} size={104} />
          </QRCodeWrapper>
        )}
        <WarningText center small>
          {t('paragraph.cautionMessage', {
            chain: t('chains.ethereum'),
            mediumText: true,
            color: colors.recieveModalWarningText,
          })}{' '}
          <Text color={colors.link} onPress={() => navigation.navigate(ETHERSPOT_DEPLOYMENT_INTERJECTION)}>
            {t('paragraph.withCaution')}
          </Text>
        </WarningText>
        <CopyButton>
          <Button title={t('button.copyAddress')} onPress={() => handleCopyToClipboard(address)} />
        </CopyButton>
        <ShareButton>
          <Button title={t('button.shareAddress')} onPress={handleAddressShare} secondary />
        </ShareButton>
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

const ContentWrapper = styled(SafeAreaView)`
  padding: 0 ${spacing.layoutSides}px 30px;
  align-items: center;
`;

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: ${spacing.largePlus}px;
`;

const WalletAddress = styled(AutoScaleText)`
  color: ${({ theme }) => theme.colors.basic030};
  margin-top: ${spacing.mediumLarge}px;
  text-align: center;
`;

const CopyButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;

const ShareButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-bottom: ${spacing.medium}px;
`;

const InfoView = styled.View`
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ImageWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const WarningText = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
  margin-top: ${spacing.medium}px;
  text-align: center;
`;
