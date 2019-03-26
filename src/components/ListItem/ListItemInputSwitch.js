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
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { Switch, Input } from 'native-base';
import { BaseText } from 'components/Typography';
import { Platform, StyleSheet } from 'react-native';

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 9px ${spacing.rhythm}px;
  background-color: #ffffff;
  border-bottom-color: ${baseColors.lightGray};
  border-top-color: ${baseColors.lightGray};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
  height: 60px;
`;

const ItemLabelHolder = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 20px 0 0;
`;

const ItemLabel = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.coolGrey};
  flex-wrap: wrap;
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px
  align-self: flex-start;
`;

const ItemValue = styled(Input)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small};
  flex-wrap: wrap;
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px
  align-self: flex-start;
`;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

type InputProps = {
  label: string,
  value?: ?string,
  onChange?: ?Function,
  onBlur?: ?Function,
};

type SwitchProps = {
  onPress?: ?Function,
  switchStatus?: ?boolean,
}

type Props = {
  inputProps: InputProps,
  switchProps: SwitchProps,
}

export default class InputSwitch extends React.Component<Props> {
  fieldValue: string = '';

  handleBlur = () => {
    const { inputProps: { onBlur } } = this.props;
    if (onBlur) {
      onBlur(this.fieldValue);
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    this.fieldValue = e.nativeEvent.text;
    onChange(this.fieldValue);
  }

  render() {
    const {
      inputProps: { value = '', label },
      switchProps: { switchStatus, onPress },
    } = this.props;

    return (
      <StyledItemView>
        <ItemLabelHolder>
          <ItemLabel>{label}</ItemLabel>
          <ItemValue
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            numberOfLines={1}
            value={value}
          />
        </ItemLabelHolder>
        <ListAddon>
          <Switch
            onValueChange={onPress}
            value={switchStatus}
          />
        </ListAddon>
      </StyledItemView>
    );
  }
}
