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
  width:100%;
`;

const SelectedOption = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small};
  flex-wrap: wrap;
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px
  align-self: flex-start;
  width:100%;
`;

const ItemSelectHolder = styled.TouchableOpacity``;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

type InputProps = {
  label: string,
  value?: ?string,
  onChange?: ?Function,
  onSelect?: ?Function,
  onBlur?: ?Function,
};

type SwitchProps = {
  onPress?: ?Function,
  switchStatus?: ?boolean,
}

type Props = {
  disabledInput?: ?boolean,
  inputType?: string,
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
      inputType,
      disabledInput,
      inputProps: { value = '', label, onSelect },
      switchProps: { switchStatus, onPress },
    } = this.props;

    let inputSection = (
      <ItemLabelHolder>
        <ItemLabel>{label}</ItemLabel>
        <ItemValue
          disabled={disabledInput}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          numberOfLines={1}
          value={value}
        />
      </ItemLabelHolder>
    );

    if (inputType && inputType === 'Select' && onSelect) {
      inputSection = (
        <ItemSelectHolder
          onPress={onSelect}
        >
          <ItemLabel>{label}</ItemLabel>
          <SelectedOption>{value}</SelectedOption>
        </ItemSelectHolder>
      );
    }

    return (
      <StyledItemView>
        {inputSection}
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
