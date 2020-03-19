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
import { BaseText } from 'components/Typography';
import styled from 'styled-components/native';
import { fontStyles } from 'utils/variables';
import Icon from 'components/Icon';
import { themedColors } from 'utils/themes';
import { noop } from 'utils/common';


export type PillItem = {
  id: string,
  label: string,
  style?: Object,
  onClose?: ?(id: string) => void,
};

const Pill = styled.View`
  border-radius: 16px;
  padding-left: 12px;
  background-color: ${themedColors.tertiary};
  align-self: flex-start;
  flex-direction: row;
`;

const Label = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.text};
`;

const CloseWrapper = styled.TouchableOpacity`
  padding: 8px;
`;

const CloseCircle = styled.View`
  height: 16px;
  width: 16px;
  border-radius: 16px;
  background-color: ${themedColors.notice};
  align-items: center;
  justify-content: center;
`;

const CloseIcon = styled(Icon)`
  font-size: 8px;
  color: ${themedColors.tertiary};
`;


const ClosablePill = (props: PillItem) => {
  const {
    label,
    id,
    style,
    onClose,
  } = props;

  return (
    <Pill style={style}>
      <Label>{label}</Label>
      <CloseWrapper onPress={() => onClose ? onClose(id) : noop()}>
        <CloseCircle>
          <CloseIcon name="close" />
        </CloseCircle>
      </CloseWrapper>
    </Pill>
  );
};

export default ClosablePill;
