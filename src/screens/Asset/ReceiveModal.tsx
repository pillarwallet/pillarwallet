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

import React, { FC, useState } from 'react';
import Clipboard from '@react-native-community/clipboard';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import Text from 'components/core/Text';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/legacy/Button';
import QRCodeWithTheme from 'components/QRCode';
import Toast from 'components/Toast';
import TextWithCopy from 'components/display/TextWithCopy';
import Icon from 'components/core/Icon';

// Utils
import { spacing, fontStyles, fontSizes, appFont, borderRadiusSizes, lineHeights } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';
import { getDeviceHeight } from 'utils/common';

// Types
import type { Theme } from 'models/Theme';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

const DEVICE_HEIGHT = getDeviceHeight();

interface IReceiveModal {
  theme: Theme;
  address: string;
  onModalHide?: () => void;
  showErc20Note?: boolean;
}

const ReceiveModal: FC<IReceiveModal> = ({ address, onModalHide, theme }) => {
  const [closeFlag, setCloseFlag] = useState(false);

  const colors = getThemeColors(theme);
  const { isDeployedOnChain } = useDeploymentStatus();
  const chains = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const handleCopyToClipboard = (addressName: string) => {
    Clipboard.setString(addressName);
    Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand', autoClose: true });
    setCloseFlag(true);
  };

  const buildDeployedList = () => {
    const deployedChains: string[] = chains.filter((chain) => !!isDeployedOnChain?.[chain]);
    let titleStr = '';
    deployedChains.map((chain, i) => {
      const { title } = chainsConfig[chain];
      if (i === 0) titleStr += title;
      else if (i === deployedChains.length - 1) titleStr += ` and ${title}`;
      else titleStr += `, ${title}`;
    });
    return titleStr;
  };

  return (
    <SlideModal
      onModalHide={onModalHide}
      hideHeader
      noTopPadding
      noPadding
      noClose
      closeFlag={closeFlag}
      propagateSwipe={false}
      backgroundElement={
        <BackgroundElementWrapper>
          {address && (
            <QRCodeWrapper>
              <QRCodeWithTheme value={address} size={200} />
            </QRCodeWrapper>
          )}
        </BackgroundElementWrapper>
      }
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <ReceiveTitle>{t('receiveModal.etherspotTitle')}</ReceiveTitle>

        <InfoView>
          <AddressWrapper>
            <TextWithCopy
              toastText={t('toast.addressCopiedToClipboard')}
              textToCopy={address}
              textStyle={[styles.address, { color: colors.secondaryText }]}
              iconColor={colors.link}
              numberOfLines={2}
            >
              {address || ''}
            </TextWithCopy>
          </AddressWrapper>
        </InfoView>

        <DeployInfoWrapper>
          <ChainIconRow>
            {chains?.map((chain) => {
              return (
                <ChainIconWrapper>
                  <ChainViewIcon width={38} style={IconContainer} name={chain + '38'} />
                  {isDeployedOnChain[chain] && (
                    <ChainDeployedIcon
                      width={18}
                      style={IconContainer}
                      name={'checkmark-circle-green'}
                      color={colors.black}
                    />
                  )}
                </ChainIconWrapper>
              );
            })}
          </ChainIconRow>

          <InfoText style={styles.singleAddressInfo}>
            {t('receiveModal.deployedOn', { deployed: buildDeployedList() })}
          </InfoText>

          <InfoText color={colors.secondaryAccent} style={styles.singleAddressInfo}>
            {t('receiveModal.checkDeploymentStatus')}
          </InfoText>
        </DeployInfoWrapper>

        <ButtonRow>
          <CopyButton>
            <Button
              title={t('button.copyAddress')}
              onPress={() => handleCopyToClipboard(address)}
              style={styles.copyButton}
            />
          </CopyButton>
        </ButtonRow>
      </ContentWrapper>
    </SlideModal>
  );
};

export default ReceiveModal;

const styles = {
  ensName: {
    fontSize: fontSizes.big,
    lineHeight: lineHeights.big,
  },
  address: {
    fontSize: fontSizes.medium,
    lineHeight: lineHeights.medium,
    textAlign: 'center',
  },
  singleAddressInfo: {
    marginTop: spacing.medium,
  },
  deployWarning: {
    marginTop: spacing.large,
  },
  flatList: {
    width: '100%',
  },
  copyButton: {
    borderRadius: borderRadiusSizes.defaultButton,
  },
};

const ContentWrapper = styled(SafeAreaView)`
  padding: 0 ${spacing.layoutSides}px 30px;
  align-items: center;
`;

const AddressWrapper = styled.View`
  padding: 0 ${spacing.extraPlusLarge}px;
`;

const ButtonRow = styled.View`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
`;

const CopyButton = styled.View`
  flex: 1;
  justify-content: space-between;
`;

const InfoView = styled.View<{ marginTop?: number }>`
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-height: ${DEVICE_HEIGHT * 0.75}px;
  padding: 0 ${spacing.extraLarge}px;
  ${({ marginTop }) => marginTop && `margin-top: ${marginTop}px;`}
`;

const InfoText = styled(Text)<{ color?: string }>`
  ${fontStyles.regular};
  text-align: center;
  color: ${({ theme, color }) => color || theme.colors.secondaryText};
`;

const IconContainer = styled.View`
  align-items: center;
  justify-content: center;
`;

const ReceiveTitle = styled.Text`
  text-align: center;
  ${fontStyles.big};
  justify-content: center;
  align-items: center;
  font-family: ${appFont.medium};
  margin: ${spacing.large}px ${spacing.largePlus}px ${spacing.mediumLarge}px;
  color: ${({ theme }) => theme.colors.text};
`;

const DeployInfoWrapper = styled.View`
  width: 100%
  background-color: ${({ theme }) => theme.colors.basic060};
  padding: ${spacing.large}px ${spacing.small}px;
  border-radius: ${borderRadiusSizes.defaultButton}px;
  margin-top: ${spacing.large}px;
`;

const ChainIconRow = styled.View`
  align-self: stretch;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ChainIconWrapper = styled.View`
  position: relative;
  width: 38px;
  height: 38px;
  padding: ${spacing.largePlus}px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChainViewIcon = styled(Icon)`
  height: 38px;
  width: 38px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
`;

const ChainDeployedIcon = styled(Icon)`
  position: absolute;
  top: 0;
  right: 0;

  height: 18px;
  width: 18px;
  border-radius: ${borderRadiusSizes.medium}px;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

const BackgroundElementWrapper = styled.View`
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0.8;
`;
