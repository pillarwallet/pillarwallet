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

import type { Theme } from 'models/Theme';

import { MediumText } from 'components/Typography';
import IconButton from 'components/IconButton';

import { fontSizes, spacing } from 'utils/variables';

type Props = {
  title: string,
  onPressClose: () => void,
  theme: Theme,
};

const Wrapper = styled.View`
  display: flex;
  width: 100%;
  flex-direction: row;
`;

const Title = styled(MediumText)`
  margin: ${spacing.large}px;
  flex-grow: 1;
  font-size: ${fontSizes.big}px;
`;

const CloseIcon = styled(IconButton)`
  padding: ${spacing.large}px;
  width: 59px;
`;

const BoxTitle = (props: Props) => (
  <Wrapper>
    <Title>{props.title}</Title>
    <CloseIcon
      icon="close"
      onPress={props.onPressClose}
      fontSize={fontSizes.big}
      color={props.theme.colors.text}
    />
  </Wrapper>
);

export default withTheme(BoxTitle);
