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
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import { SDK_PROVIDER } from 'react-native-dotenv';

import TextInput from 'components/TextInput';


export function selectorInputTemplate(locals: Object) {
  const {
    config: {
      label,
      customLabel,
      hasInput,
      placeholderSelector,
      placeholderInput,
      options,
      horizontalOptions = [],
      inputAddonText,
      inputRef,
      onSelectorOpen,
      horizontalOptionsTitle,
      optionsTitle,
      selectorModalTitle,
      inputWrapperStyle,
      fiatOptions,
      fiatOptionsTitle,
      displayFiatOptionsFirst,
      rightLabel,
      onPressRightLabel,
      customInputHeight,
      inputHeaderStyle,
    },
  } = locals;
  const value = get(locals, 'value', {});
  const { selector = {} } = value;
  const { iconUrl } = selector;
  const selectedOptionIcon = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
  const selectorValue = {
    ...value,
    selector: { ...selector, icon: selectedOptionIcon },
  };

  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    autoCapitalize: locals.autoCapitalize,
    maxLength: 42,
    placeholderSelector,
    placeholder: placeholderInput,
    onSelectorOpen,
    selectorValue,
    label,
    customLabel,
    rightLabel,
    onPressRightLabel,
    inputHeaderStyle,
  };

  return (
    <TextInput
      style={{ width: '100%' }}
      hasError={!!locals.error}
      inputProps={inputProps}
      leftSideText={inputAddonText}
      numeric
      selectorOptions={{
        options,
        horizontalOptions,
        showOptionsTitles: !isEmpty(horizontalOptions),
        optionsTitle,
        horizontalOptionsTitle,
        fiatOptions,
        fiatOptionsTitle,
        fullWidth: !hasInput,
        selectorModalTitle: selectorModalTitle || label,
        selectorPlaceholder: placeholderSelector,
        optionsSearchPlaceholder: 'Asset search',
        displayFiatOptionsFirst,
      }}
      getInputRef={inputRef}
      inputWrapperStyle={inputWrapperStyle}
      customInputHeight={customInputHeight}
    />
  );
}
