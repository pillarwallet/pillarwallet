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

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

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
  const { isDeployedOnChain, showDeploymentInterjection } = useDeploymentStatus();

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
              textStyle={styles.ensName}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {ensName}
            </TextWithCopy>
          )}
          {ensName ? (
            <WalletAddress numberOfLines={1} adjustsFontSizeToFit>
              {address}
            </WalletAddress>
          ) : (
            <TextWithCopy
              toastText={t('toast.addressCopiedToClipboard')}
              textToCopy={address}
              textStyle={[styles.address, { color: colors.secondaryText }]}
              iconColor={colors.link}
              adjustsFontSizeToFit
              numberOfLines={1}
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
        {activeAccount?.type !== ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET && (
          <WarningText style={{ marginTop: spacing.medium }} center small>
            {t('receiveModal.message')}
          </WarningText>
        )}
        {!isDeployedOnChain[CHAIN.ETHEREUM] && (
          <WarningText center small>
            {t('receiveModal.cautionMessage', {
              chain: t('chains.ethereum'),
              mediumText: true,
              color: colors.recieveModalWarningText,
            })}{' '}
            <Text color={colors.link} onPress={() => showDeploymentInterjection(CHAIN.ETHEREUM)}>
              {t('receiveModal.withCaution')}
            </Text>
          </WarningText>
        )}
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

const styles = {
  ensName: {
    fontSize: fontSizes.big,
  },
  address: {
    fontSize: fontSizes.small,
  },
};

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

const WalletAddress = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  margin-top: ${spacing.mediumLarge}px;
  text-align: center;
  font-size: ${fontSizes.small}px;
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
  color: ${({ theme }) => theme.colors.secondaryText};
  text-align: center;
`;
