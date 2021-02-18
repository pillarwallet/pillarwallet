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
import { TouchableNativeFeedback, Platform } from 'react-native';
import styled from 'styled-components/native';

type Props = {
  onPress?: ?() => void,
  children: React.Node,
  disabled?: boolean,
  noRipple?: boolean,
}

const StyledItemTouchable = styled.TouchableOpacity`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const NativeTouchable = (props: Props) => {
  const {
    onPress,
    children,
    disabled,
    noRipple,
  } = props;

  if (Platform.OS === 'ios' || noRipple) {
    return (
      <StyledItemTouchable
        onPress={onPress}
        disabled={!onPress || disabled}
      >
        {children}
      </StyledItemTouchable>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      // $FlowFixMe: react-native types
      background={TouchableNativeFeedback.Ripple()}
      disabled={!onPress || disabled}
    >
      <StyledItemView>
        {children}
      </StyledItemView>
    </TouchableNativeFeedback>
  );
};

export default NativeTouchable;
