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

type Value = string | number;

type SelectorValueType = {
  input: string | number,
  selector: {
    icon?: string,
    iconFallback?: string,
    value: string | number,
  }
};

export type InputPropsType = {
  placeholder?: string,
  onChange: (Value | SelectorValueType) => void, onBlur?: (Value | SelectorValueType) => void,
  value: Value,
  selectorValue: SelectorValueType,
  multiline?: boolean,
  onSelectorOpen?: () => void,
  onSelectorChange?: () => void,
  label?: string,
};

export type SelectorOptions = {
  options?: Array<Object>,
  horizontalOptions?: Array<Object>,
  fiatOptions?: Array<Object>,
  selectorPlaceholder?: 'string',
  fullWidth?: boolean,
  showOptionsTitles?: boolean,
  horizontalOptionsTitle?: string,
  optionsTitle?: string,
  fiatOptionsTitle?: string,
  selectorModalTitle?: string,
  optionsSearchPlaceholder?: string,
  displayFiatOptionsFirst?: boolean,
};
