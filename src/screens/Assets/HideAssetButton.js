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
import { TouchableOpacity, Platform } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  onPress: Function,
  expanded?: boolean,
  disabled?: boolean,
}

const HideButtonWrapper = styled.View`
  padding: ${Platform.select({
    ios: props => props.expanded ? '10px 20px' : '15px 10px',
    android: props => props.expanded ? '10px 20px' : '10px 10px 20px',
  })};
  justify-content: center;
  align-items: flex-start;
  flex: 1;
  margin-left: 6px;
`;

const HideButtonLabel = styled(BaseText)`
  color: ${baseColors.burningFire};
  font-size: ${props => props.expanded ? fontSizes.extraSmall : fontSizes.extraExtraSmall}px;
  margin-top: 8px;
  opacity: ${props => props.disabled ? 0.5 : 1}
`;

const HideAssetButton = (props: Props) => {
  const { onPress, expanded, disabled } = props;
  return (
    <HideButtonWrapper expanded={expanded}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon
          name="turn-off"
          style={{
            color: baseColors.burningFire,
            fontSize: expanded ? fontSizes.medium : fontSizes.small,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <HideButtonLabel expanded={expanded} disabled={disabled}>
          Hide
        </HideButtonLabel>
      </TouchableOpacity>
    </HideButtonWrapper>
  );
};

export default HideAssetButton;
