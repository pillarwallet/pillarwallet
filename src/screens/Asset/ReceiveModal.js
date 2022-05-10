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
import { Share, FlatList } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';

// Components
import Text from 'components/core/Text';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/legacy/Button';
import QRCodeWithTheme from 'components/QRCode';
import Toast from 'components/Toast';
import ProfileImage from 'components/ProfileImage';
import TextWithCopy from 'components/display/TextWithCopy';
import Icon from 'components/core/Icon';

// Utils
import { spacing, fontStyles, fontSizes, appFont, borderRadiusSizes } from 'utils/variables';
import { getAccountEnsName, isEtherspotAccount, isKeyBasedAccount } from 'utils/accounts';
import { getThemeColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';
import { getDeviceHeight } from 'utils/common';

// Types
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';
import type { RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';
import type { Theme } from 'models/Theme';

// Selectors
import { activeAccountSelector } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Services
import etherspotService from 'services/etherspot';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Constants
import { CHAIN } from 'constants/chainConstants';

const DEVICE_HEIGHT = getDeviceHeight();
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

const ReceiveModal = ({ activeAccount, address, onModalHide, user, theme }: Props) => {
  const [closeFlag, setCloseFlag] = React.useState(false);
  const handleAddressShare = useCallback(() => {
    Share.share({ title: t('title.publicAddress'), message: address });
  }, [address]);

  const colors = getThemeColors(theme);
  const { isDeployedOnChain, showDeploymentInterjection } = useDeploymentStatus();
  const chains = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const handleCopyToClipboard = (addressName: string) => {
    Clipboard.setString(addressName);
    Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
    setCloseFlag(true);
  };

  const handleCopyFromChain = (chain: Chain, title: string) => {
    if (isEtherspotAccount(activeAccount)) {
      const accountAddress = etherspotService.getAccountAddress(chain);
      if (accountAddress) {
        Clipboard.setString(accountAddress);
        Toast.show({
          message: t('toast.chainAddressCopiedToClipboard', { chain: title }),
          emoji: 'ok_hand',
          autoClose: true,
        });
        setCloseFlag(true);
      } else {
        Toast.show({ message: t('toast.missingCopyAddress'), emoji: 'hushed', autoClose: false });
      }
    } else {
      handleCopyToClipboard(address);
    }
  };

  const showWarning = !isKeyBasedAccount(activeAccount) && !isDeployedOnChain.ethereum;
  const { username } = user;
  const ensName = getAccountEnsName(activeAccount);

  const renderChainAddress = (chain: Chain) => {
    const { title } = chainsConfig[chain];

    return (
      <Container activeOpacity={1} key={`${chain}`}>
        <ContainerView>
          <RowContainer>
            <ChainViewIcon size={24} style={IconContainer} name={chain} />
            <Title style={{ flex: 0 }}>{title}</Title>
            <CopyButtonFromChain>
              <Button
                width="100%"
                height="48"
                style={{ borderRadius: 14 }}
                title={t('receiveModal.copyButton')}
                onPress={() => handleCopyFromChain(chain, title)}
              />
            </CopyButtonFromChain>
          </RowContainer>
          {!isDeployedOnChain[chain] && (
            <DeployText>
              {t('receiveModal.notDeployedText', {
                chain: title,
                mediumText: true,
                color: colors.recieveModalWarningText,
              })}{' '}
              {t('receiveModal.activationText', {
                chain: title,
                mediumText: true,
                color: colors.recieveModalWarningText,
              })}{' '}
              <ActivateText onPress={() => showDeploymentInterjection(chain)}>
                {t('receiveModal.activateText', {
                  mediumText: true,
                })}
              </ActivateText>
            </DeployText>
          )}
        </ContainerView>
      </Container>
    );
  };

  return (
    <SlideModal
      onModalHide={onModalHide}
      noPadding
      noClose
      showHeader
      closeFlag={closeFlag}
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
        !isEtherspotAccount(activeAccount) ? (
          <ImageWrapper style={{ position: 'absolute', marginTop: -24 }}>
            <ProfileImage userName={username == null ? address : username} diameter={48} />
          </ImageWrapper>
        ) : (
          <ReceiveTitle>{t('receiveModal.title')}</ReceiveTitle>
        )
      }
    >
      {isEtherspotAccount(activeAccount) ? (
        <ContentWrapper forceInset={{ bottom: 'always' }}>
          <InfoView>
            <FlatList
              bounces={false}
              data={chains}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={styles.flatList}
              renderItem={({ item }) => renderChainAddress(item)}
            />
          </InfoView>
        </ContentWrapper>
      ) : (
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
          {isEtherspotAccount(activeAccount) && (
            <WarningText style={styles.singleAddressInfo}>{t('receiveModal.etherspotSingleAddressInfo')}</WarningText>
          )}
          {showWarning && (
            <WarningText>
              {t('receiveModal.notDeployedWarning', {
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
            <Button transparent title={t('button.share')} onPress={handleAddressShare} />
          </ShareButton>
        </ContentWrapper>
      )}
    </SlideModal>
  );
};

const mapStateToProps = ({ user: { data: user } }: RootReducerState): $Shape<StateProps> => ({
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
  singleAddressInfo: {
    marginTop: spacing.medium,
  },
  flatList: {
    width: '100%',
  },
};

const ContentWrapper = styled(SafeAreaView)`
  padding: 10px ${spacing.layoutSides}px 30px;
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

const CopyButtonFromChain = styled.View`
  flex-direction: column;
  text-align: center;
  align-items: center;
  width: 40%;
  border-radius: ${borderRadiusSizes.defaultButton}px;
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
  max-height: ${DEVICE_HEIGHT * 0.75}px;
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

const ActivateText = styled(Text)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.link};
  text-align: center;
`;

const DeployText = styled(Text)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.basic020};
  justify-content: center;
  margin: ${spacing.small}px 0 0;
  padding: 0 ${spacing.medium}px 20px ${spacing.medium}px;
`;

const IconContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const Container = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.basic60};
  flex-direction: row;
  margin: ${spacing.small}px 0;
  padding: ${spacing.medium}px;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
`;

const Title = styled(Text)`
  flex: 1;
  flex-direction: row;
  ${fontStyles.medium};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
  margin: 10px 0;
`;

const ReceiveTitle = styled.Text`
  text-align: center;
  ${fontStyles.big};
  justify-content: center;
  align-items: center;
  font-family: ${appFont.medium};
  margin: ${spacing.small + spacing.large}px ${spacing.largePlus}px ${spacing.mediumLarge}px;
  color: ${({ theme }) => theme.colors.text};
`;

const ContainerView = styled.View`
  flex: 1;
  flex-direction: column;
`;

const RowContainer = styled.View`
  flex-direction: row;
  padding: ${spacing.small}px;
`;

const ChainViewIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
  margin: 10px 0;
`;
