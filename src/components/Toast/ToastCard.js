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

import React from 'react';
import styled from 'styled-components/native';
import Emoji from 'react-native-emoji';

import ShadowedCard from 'components/ShadowedCard';
import { Spacing } from 'components/Layout';
import { MediumText, TextLink } from 'components/Typography';
import Icon from 'components/Icon';

import { themedColors } from 'utils/themes';

export type Props = {
  message: string,
  emoji: string,
  link?: string,
  onPress?: () => void,
  onClose?: () => void,
  onLinkPress?: () => void,
};

const ContentWrapper = styled.View`
  flex-direction: row;
  padding: 14px 55px 14px 20px;
  align-items: flex-start;
`;

const CloseIconWrapper = styled.TouchableOpacity`
  position: absolute;
  top: 7px;
  right: 8px;
  padding: 10px;
`;

const CloseIcon = styled(Icon)`
  color: ${themedColors.toastCloseIcon};
  font-size: 16px;
`;

const ToastCard = ({
  message,
  emoji,
  link,
  onPress,
  onClose,
  onLinkPress,
}: Props) => {
  return (
    <ShadowedCard
      forceShadow
      shadowColor="#000"
      shadowOpacity={0.06}
      borderRadius={20}
      onPress={onPress}
    >
      <ContentWrapper>
        {!!emoji && <Emoji name={emoji} style={{ fontSize: 16 }} />}
        <Spacing w={18} />
        <MediumText regular style={{ flex: 1 }}>
          {message}
          {!!link && <TextLink onPress={onLinkPress} regular> {link}</TextLink>}
        </MediumText>
      </ContentWrapper>
      <CloseIconWrapper onPress={onClose}>
        <CloseIcon name="rounded-close" />
      </CloseIconWrapper>
    </ShadowedCard>
  );
};

export default ToastCard;
