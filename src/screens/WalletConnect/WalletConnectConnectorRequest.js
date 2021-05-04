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
import styled, { withTheme } from 'styled-components/native';
import { Keyboard } from 'react-native';
import t from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Image from 'components/Image';
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { images } from 'utils/images';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// types
import type { Theme } from 'models/Theme';


type Props = {
  theme: Theme,
};


const FooterWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const OptionButton = styled(Button)`
  margin-top: 4px;
  flex-grow: 1;
`;


const WalletConnectConnectorRequestScreen = ({ theme }: Props) => {
  const navigation = useNavigation();
  const { approveConnectorRequest, cancelConnectorRequest } = useWalletConnect();

  const {
    description,
    url,
    icons,
    name,
  } = navigation.getParam('peerMeta', {});
  const peerId = navigation.getParam('peerId');

  const onApprovePress = () => {
    Keyboard.dismiss();
    approveConnectorRequest(peerId);
    navigation.goBack(null);
  };

  const onRejectPress = () => {
    Keyboard.dismiss();
    cancelConnectorRequest(peerId);
    navigation.goBack(null);
  };

  const icon = icons && icons.length ? icons[0] : null;
  const { genericToken } = images(theme);

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
            fallbackSource={genericToken}
            resizeMode="contain"
          />
        )}
        <LabeledRow>
          <Label>{t('walletConnectContent.label.name')}</Label>
          <Value>{name || t('walletConnectContent.label.unknownRequestName')}</Value>
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
          <OptionButton
            onPress={onApprovePress}
            title={t('button.approve')}
          />
          <OptionButton
            transparent
            danger
            onPress={onRejectPress}
            title={t('button.reject')}
          />
        </FooterWrapper>
      </Footer>
    </ContainerWithHeader>
  );
};

export default withTheme(WalletConnectConnectorRequestScreen);
