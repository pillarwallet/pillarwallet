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
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';

import Image from 'components/Image';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';

import type { Theme } from 'models/Theme';
import type { ParsedCMSDocument } from 'models/CMSData';

import { fontStyles } from 'utils/variables';
import { getDeviceWidth } from 'utils/common';

const Title = styled(MediumText)`
  ${fontStyles.large};
  margin: 40px 0px;
`;

const SubTitle = styled(MediumText)`
  ${fontStyles.regular};
  margin: 20px 0px;
`;

const Body = styled(BaseText)`
  ${fontStyles.regular};
`;

type Props = {
  theme: Theme,
  document: ParsedCMSDocument,
};

const CMSView = ({ document }: Props) => {
  const {
    title, subtitle, body, imageUrl,
  } = document;
  return (
    <ContainerWithHeader style={{ width: getDeviceWidth() }}>
      <View>
        <Title>{title}</Title>
        <SubTitle>{subtitle}</SubTitle>
        <Image source={{ url: imageUrl }} />
        <Body>{body}</Body>
      </View>
    </ContainerWithHeader>
  );
};

export default withTheme(CMSView);
