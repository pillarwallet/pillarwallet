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
import { ButtonNext } from 'components/Button';
import styled from 'styled-components/native';

type Props = {
  children: React.Node,
  nextDisabled?: boolean,
  onNextPress: Function,
  wrapperStyle?: Object,
  contentAlign?: string,
}

const FooterWrapper = styled.KeyboardAvoidingView`
  padding: 30px;
  flex-direction: column;
`;

const InnerWrapper = styled.KeyboardAvoidingView`
  flex-direction: row;
  align-items: ${props => props.contentAlign || 'flex-end'};
  width: 100%;
`;

const LeftSide = styled.View`
  flex: 1;
  padding: 14px 20px 14px 0;
  flex-wrap: wrap;
`;

export const NextFooter = (props: Props) => {
  const {
    children,
    nextDisabled,
    onNextPress,
    wrapperStyle,
    contentAlign,
  } = props;
  return (
    <FooterWrapper style={wrapperStyle}>
      <InnerWrapper contentAlign={contentAlign}>
        <LeftSide>
          {children}
        </LeftSide>
        <ButtonNext
          disabled={nextDisabled}
          onPress={onNextPress}
        />
      </InnerWrapper>
    </FooterWrapper>
  );
};
