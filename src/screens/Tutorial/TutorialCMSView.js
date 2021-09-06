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
import { ScrollView, View } from 'react-native';
import styled from 'styled-components/native';

import Image from 'components/Image';
import { BaseText, MediumText } from 'components/legacy/Typography';

import type { ParsedCmsDocument } from 'models/CMSData';

import { fontStyles, spacing } from 'utils/variables';
import { getDeviceWidth } from 'utils/common';

export const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
`;

export const SubTitle = styled(MediumText)`
  ${fontStyles.regular};
  margin: ${spacing.rhythm / 2}px 0px;
  text-align: center;
`;

const Body = styled(BaseText)`
  ${fontStyles.regular};
`;

type Props = {
  document: ParsedCmsDocument,
};

const DEVICE_WIDTH = getDeviceWidth();

export default ({ document }: Props) => {
  const {
    title, subtitle, body, imageUrl, imageWidth, imageHeight,
  } = document;

  const getImageStyle = () => {
    const width = DEVICE_WIDTH - (2 * spacing.rhythm);
    const ratio = imageHeight / imageWidth;
    const height = width * ratio;
    return { width, height, marginVertical: 20 };
  };

  return (
    <ScrollView
      style={{ flex: 1, width: DEVICE_WIDTH }}
      contentContainerStyle={{ padding: spacing.rhythm, justifyContent: 'space-evenly', flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View>
        <Title>{title}</Title>
        <SubTitle>{subtitle}</SubTitle>
      </View>
      <Image
        source={{ uri: imageUrl }}
        style={getImageStyle()}
        resizeMode="contain"
      />
      <Body>{body}</Body>
    </ScrollView>
  );
};

