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
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Image from 'components/Image';
import Title from 'components/Title';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { chainFromChainId, mapChainToChainId } from 'utils/chains';
import { useThemedImages } from 'utils/images';
import { useChainConfig } from 'utils/uiConfig';
import { spacing, fontSizes } from 'utils/variables';
import { parsePeerName, pickPeerIcon } from 'utils/walletConnect';


const WalletConnectConnectorRequestScreen = () => {
  const navigation = useNavigation();
  const { genericToken } = useThemedImages();

  const { approveConnectorRequest, rejectConnectorRequest } = useWalletConnect();

  const peerMeta = navigation.getParam('peerMeta', {});
  const peerId = navigation.getParam('peerId');

  const initialChainId = navigation.getParam('chainId');
  const chain = chainFromChainId[initialChainId] ?? CHAIN.ETHEREUM;

  // Note: this will map chain id to testnet in test env.
  const chainId = mapChainToChainId(chain);
  const chainConfig = useChainConfig(chain);

  const onApprovePress = () => {
    Keyboard.dismiss();
    approveConnectorRequest(peerId, chainId);
    navigation.goBack(null);
  };

  const onRejectPress = () => {
    Keyboard.dismiss();
    rejectConnectorRequest(peerId);
    navigation.goBack(null);
  };

  const name = parsePeerName(peerMeta.name);
  const icon = pickPeerIcon(peerMeta.icons);
  const { description, url } = peerMeta;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('walletConnectContent.title.walletConnect') }],
        customOnBack: onRejectPress,
      }}
    >
      <ScrollWrapper regularPadding>
        <Title subtitle title={t('walletConnectContent.title.walletConnectRequests')} />

        {!!icon && (
          <Image
            key={name}
            style={{
              height: 55,
              width: 55,
              marginBottom: spacing.mediumLarge,
            }}
            source={{ uri: icon }}
            fallback
            fallbackSource={genericToken}
            resizeMode="contain"
          />
        )}

        <LabeledRow>
          <Label>{t('walletConnectContent.label.name')}</Label>
          <Value>{name || t('walletConnectContent.label.unknownRequestName')}</Value>
        </LabeledRow>

        <LabeledRow>
          <Label>{t('walletConnectContent.label.chain')}</Label>
          <Value>{chainConfig?.title}</Value>
        </LabeledRow>

        {!!description && (
          <LabeledRow>
            <Label>{t('walletConnectContent.label.requestDescription')}</Label>
            <Value>{description}</Value>
          </LabeledRow>
        )}

        {!!url && (
          <LabeledRow>
            <Label>{t('walletConnectContent.label.requestLink')}</Label>
            <Value>{url}</Value>
          </LabeledRow>
        )}
      </ScrollWrapper>

      <Footer keyboardVerticalOffset={40}>
        <FooterWrapper>
          <OptionButton onPress={onApprovePress} title={t('button.approve')} />
          <OptionButton transparent danger onPress={onRejectPress} title={t('button.reject')} />
        </FooterWrapper>
      </Footer>
    </ContainerWithHeader>
  );
};

export default WalletConnectConnectorRequestScreen;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const FooterWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const OptionButton = styled(Button)`
  flex-grow: 1;
`;
