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
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';

// utils
import { baseColors, fontStyles } from 'utils/variables';

type Props = {
  onPress: Function,
  label: string,
  labelColor: string,
}

const SWButtonWrapper = styled.TouchableOpacity`
  flex-direction: row;
  padding: 0 14px;
  align-items: center;
  min-height: 20px;
  margin-right: -14px;
`;

const ButtonIcon = styled(Icon)`
  ${fontStyles.tiny};
  color: ${baseColors.secondaryText};
`;

const ButtonText = styled(BaseText)`
  color: ${props => props.color};
  ${fontStyles.regular};
`;

const IconsWrapper = styled.View`
  flex-direction: column;
  margin-left: 8px;
  justify-content: space-between;
  align-items: center;
  height: 20px;
`;

export const ManageWalletsButton = (props: Props) => {
  const { onPress, label, labelColor } = props;
  return (
    <SWButtonWrapper
      onPress={onPress}
    >
      <ButtonText color={labelColor}>
        {label}
      </ButtonText>
      <IconsWrapper>
        <ButtonIcon
          name="chevron-right"
          style={{ transform: [{ rotate: '-90deg' }] }}
        />
        <ButtonIcon
          name="chevron-right"
          style={{ transform: [{ rotate: '90deg' }] }}
        />
      </IconsWrapper>
    </SWButtonWrapper>
  );
};

