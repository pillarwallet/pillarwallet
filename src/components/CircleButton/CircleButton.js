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
import { ImageBackground, Image } from 'react-native';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';

type Props = {
  disabled?: boolean,
  onPress: Function,
  label: string,
  icon: string,
}

const CircleButtonIconWrapperColors = ['#ffffff', '#f2f4f9'];

const CircleButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: 8px 4px 0px;
`;

const CircleButtonIconWrapper = styled.View`
  border-radius: 46;
  width: 92px;
  height: 92px;
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CircleButtonIcon = styled(Image)`
  height: 24px;
  width: 24px;
  opacity: ${props => props.disabled ? 0.3 : 1};
  justify-content: center;
  display: flex;
`;

const CircleButtonText = styled(BaseText)`
  color: ${props => props.disabled ? baseColors.mediumGray : baseColors.electricBlue};
  opacity: ${props => props.disabled ? 0.7 : 1};
  text-align: center;
  font-size: ${fontSizes.small};
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: -6px;
`;

const actionButtonBackground = require('assets/images/bg_action_button.png');
const actionButtonBackgroundDisabled = require('assets/images/bg_action_button_disabled.png');


const CircleButton = (props: Props) => {
  const {
    disabled,
    onPress,
    icon,
    label,
  } = props;

  return (
    <CircleButtonWrapper
      disabled={disabled}
      onPress={() => onPress()}
    >
      <ImageBackground
        source={disabled ? actionButtonBackgroundDisabled : actionButtonBackground}
        style={{ width: 92, height: 92 }}
      >
        <CircleButtonIconWrapper
          disabled={disabled}
          colors={CircleButtonIconWrapperColors}
        >
          <CircleButtonIcon
            disabled={disabled}
            source={icon}
          />
        </CircleButtonIconWrapper>

      </ImageBackground>
      <CircleButtonText disabled={disabled}>
        {label}
      </CircleButtonText>
    </CircleButtonWrapper>
  );
};

export default CircleButton;
