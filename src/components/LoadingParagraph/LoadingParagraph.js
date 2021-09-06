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
import { BaseText } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';
import { fontStyles } from 'utils/variables';

type Props = {
  isLoading: boolean,
  text: string,
  paragraphProps?: Object,
};

const Wrapper = styled.View`
  width: 100%;
  position: relative;
`;

const Paragraph = styled(BaseText)`
  ${fontStyles.regular};
  ${({ isHidden }) => isHidden && 'opacity : 0'};
`;

const AbsoluteSpinner = styled(Spinner)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -10px;
  margin-left: -10px;
`;

const LoadingParagraph = (props: Props) => {
  const { text, isLoading, paragraphProps = {} } = props;

  return (
    <Wrapper>
      <Paragraph {...paragraphProps} isHidden={isLoading}>
        {text}
      </Paragraph>
      {!!isLoading && <AbsoluteSpinner size={20} trackWidth={2} />}
    </Wrapper>
  );
};

export default LoadingParagraph;
