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
import { MediumText } from 'components/legacy/Typography';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  children: React.Node,
  wrapperStyle?: Object,
  textStyle?: Object,
  testID?: string,
  accessibilityLabel?: string,
};

const ErrorMessageBackground = styled.View`
  width: 100%;
  padding: 20px;
  margin: 20px 0 0;
`;

const ErrorMessageText = styled(MediumText)`
  color: ${themedColors.negative};
  text-align: center;
  ${fontStyles.medium};
`;

const ErrorMessage = (props: Props) => {
  const { wrapperStyle, textStyle, testID, accessibilityLabel } = props;
  return (
    <ErrorMessageBackground style={wrapperStyle}>
      <ErrorMessageText testID={testID} accessibilityLabel={accessibilityLabel} style={textStyle}>
        {props.children}
      </ErrorMessageText>
    </ErrorMessageBackground>
  );
};

export default ErrorMessage;
