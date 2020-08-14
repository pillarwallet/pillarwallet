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
import TextInput from 'components/TextInput';

import type { Option } from 'models/Selector';

import ExchangeInputHeader from './ExchangeInputHeader';

type Props = {
  onBlur: () => void,
  errorMessage?: string,
  asset: Option,
  onAssetPress: () => void,
  labelText?: string,
  onLabelPress?: () => void,
  onChange: (val: string) => void,
  value: string,
  leftSideText: string,
  onLeftSideTextPress: () => void,
  leftSideSymbol: string,
  rightPlaceholder: string,
}

export default class ExchangeTextInput extends React.PureComponent<Props> {
    getCustomLabel = () => {
      const {
        asset, onAssetPress, labelText, onLabelPress,
      } = this.props;
      return (
        <ExchangeInputHeader
          asset={asset}
          onAssetPress={onAssetPress}
          labelText={labelText}
          onLabelPress={onLabelPress}
        />
      );
    }

    render() {
      const {
        rightPlaceholder,
        errorMessage,
        onAssetPress,
        onBlur,
        onChange,
        value,
        leftSideText,
        onLeftSideTextPress,
        leftSideSymbol,
      } = this.props;
      const inputProps = {
        value,
        onBlur,
        maxLength: 42,
        customLabel: this.getCustomLabel(),
        onChange,
        placeholder: '0',
        keyboardType: 'decimal-pad',
      };
      return (
        <TextInput
          style={{ width: '100%' }}
          hasError={!!errorMessage}
          errorMessage={errorMessage}
          inputProps={inputProps}
          numeric
          itemHolderStyle={{ borderRadius: 10 }}
          leftSideText={leftSideText}
          leftSideSymbol={leftSideSymbol}
          onLeftSideTextPress={onLeftSideTextPress}
          rightPlaceholder={rightPlaceholder}
          onRightAddonPress={onAssetPress}
        />
      );
    }
}
