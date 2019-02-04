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
import { Image } from 'react-native';
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { spacing } from 'utils/variables';

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 8px ${spacing.rhythm}px;
`;

type Props = {
  title: string,
  bodyText: string,
}

const esLeft = require('assets/images/esLeft.png');
const esRight = require('assets/images/esRight.png');

const EmptyTransactions = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <Wrapper
      fullScreen
      style={{
        paddingTop: 90,
        paddingBottom: 90,
        alignItems: 'center',
      }}
    >
      <EmptyStateBGWrapper>
        <Image source={esLeft} resizeMode="contain" />
        <Image source={esRight} resizeMode="contain" />
      </EmptyStateBGWrapper>
      <EmptyStateParagraph
        title={title}
        bodyText={bodyText}
      />
    </Wrapper>
  );
};

export default EmptyTransactions;
