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
import { MediumText, TextLink } from 'components/Typography';

// utils
import { spacing, fontSizes } from 'utils/variables';

const FontSize = fontSizes.regular;

const Wrapper = styled.View`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  margin: 0 0 ${spacing.large}px;
`;

const CustomText = styled(MediumText)`
  font-size: ${FontSize}px;
  line-height: ${FontSize}px;
`;

const CustomLink = styled(TextLink)`
  font-size: ${FontSize}px;
  line-height: ${FontSize}px;
`;

type Props = {
  onPressResend: () => void,
};

const ResendMessage = (props: Props) => {
  const { onPressResend } = props;

  return (
    <Wrapper>
      <CustomText>Didn&apos;t receive the code?</CustomText>
      <CustomLink onPress={onPressResend}> Resend it. </CustomLink>
    </Wrapper>
  );
};

export default ResendMessage;
