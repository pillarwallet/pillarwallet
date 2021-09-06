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
import styled from 'styled-components/native';

// components
import { MediumText } from 'components/legacy/Typography';
import IconButton from 'components/IconButton';

// utils
import { fontSizes, spacing } from 'utils/variables';

type Props = {
  title: string,
  onPressClose: () => void,
};

const Wrapper = styled.View`
  align-items: flex-start;
  display: flex;
  width: 100%;
  flex-direction: row;
`;

const Title = styled(MediumText)`
  flex: 1;
  margin: ${spacing.rhythm}px;
  margin-bottom: ${spacing.small}px;
  font-size: ${fontSizes.big}px;
`;

const CloseIcon = styled(IconButton).attrs({
  icon: 'close',
  fontSize: fontSizes.regular,
  secondary: true,
})`
  padding: ${spacing.layoutSides}px;
`;

const BoxTitle = (props: Props) => {
  return (
    <Wrapper>
      <Title>{props.title}</Title>
      <CloseIcon onPress={props.onPressClose} />
    </Wrapper>
  );
};

export default BoxTitle;
