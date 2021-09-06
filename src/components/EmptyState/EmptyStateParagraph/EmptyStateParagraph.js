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
import { fontStyles } from 'utils/variables';
import { BaseText, MediumText } from 'components/legacy/Typography';
import { themedColors } from 'utils/themes';

type Props = {
  title?: string,
  bodyText?: string,
  large?: boolean,
  wide?: boolean,
  children?: React.Node,
}

const EmptySectionTextWrapper = styled.View`
  ${({ wide }) => !wide && 'min-width: 234px; width: 80%;'}
  align-items: center;
  justify-content: center;
`;

const EmptySectionTitle = styled(MediumText)`
  ${({ large }) => large ? fontStyles.large : fontStyles.big};
  margin-bottom: 6px;
  text-align: center;
`;

const EmptySectionText = styled(BaseText)`
  ${fontStyles.medium};
  text-align: center;
  flex-wrap: wrap;
  color: ${themedColors.secondaryText};
`;

const EmptyStateParagraph = (props: Props) => {
  const {
    title,
    bodyText,
    large,
    wide,
    children,
  } = props;

  return (
    <EmptySectionTextWrapper wide={wide}>
      {!!title && <EmptySectionTitle large={large}>{title}</EmptySectionTitle>}
      {!!bodyText && <EmptySectionText>{bodyText}</EmptySectionText>}
      {children}
    </EmptySectionTextWrapper>
  );
};

export default EmptyStateParagraph;
