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
import { baseColors, fontStyles } from 'utils/variables';
import { BaseText, Paragraph } from 'components/Typography';

type Props = {
  title: string,
  bodyText?: string,
}

const EmptySectionTextWrapper = styled.View`
  width: 234px;
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled(BaseText)`
  ${fontStyles.big};
  color: ${baseColors.slateBlack};
  margin-bottom: 6px;
  text-align: center;
`;

const EmptySectionText = styled(Paragraph)`
  text-align: center;
`;

const EmptyStateParagraph = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <EmptySectionTextWrapper>
      <EmptySectionTitle>{title}</EmptySectionTitle>
      {!!bodyText && <EmptySectionText small light>{bodyText}</EmptySectionText>}
    </EmptySectionTextWrapper>
  );
};

export default EmptyStateParagraph;
