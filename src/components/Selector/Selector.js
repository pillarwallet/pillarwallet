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

import React, { useRef } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { MediumText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SelectorOptions from 'components/SelectorOptions';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Modal from 'components/Modal';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// utils
import { spacing } from 'utils/variables';
import { isValidAddress } from 'utils/validators';
import { noop } from 'utils/common';

// types
import type { HorizontalOption, Option } from 'models/Selector';


export type Props = {|
  selectedOption?: ?Option,
  onOptionSelect?: (option: Option) => void | Promise<void>,
  onOptionImagePress?: (option: Option) => void,
  label?: string,
  placeholder?: string,
  optionsTitle?: string,
  options?: Option[],
  searchPlaceholder?: string,
  horizontalOptionsData?: HorizontalOption[],
  wrapperStyle?: Object,
  noOptionImageFallback?: boolean,
  hasQRScanner?: boolean,
  disableSelfSelect?: boolean,
  activeAccountAddress?: string,
  allowEnteringCustomAddress?: boolean,
  children?: any,
  customOptionButtonLabel?: string,
  customOptionButtonOnPress?: (option: Option) => void | Promise<void>,
  onCustomOptionSet?: (option: Option) => void,
|};

const Wrapper = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px ${spacing.layoutSides}px;
`;

const SelectedOption = styled.TouchableOpacity`
  flex: 1;
`;

const Selector = ({
  onOptionSelect = noop,
  disableSelfSelect,
  activeAccountAddress,
  onOptionImagePress = noop,
  label = t('label.select'),
  placeholder = t('label.choseOption'),
  optionsTitle,
  options,
  searchPlaceholder = t('label.search'),
  selectedOption,
  horizontalOptionsData,
  wrapperStyle,
  noOptionImageFallback,
  hasQRScanner,
  allowEnteringCustomAddress,
  children,
  customOptionButtonLabel,
  customOptionButtonOnPress,
  onCustomOptionSet,
}: Props) => {
  const optionsRef = useRef();

  const handleScannerReadResult = (address: string) => {
    if (isValidAddress(address)) {
      const option = {
        value: address,
        ethAddress: address,
        name: address,
      };
      onOptionSelect(option);
      if (optionsRef.current) {
        optionsRef.current.close();
      }
    }
  };

  const handleScannerOpen = () => {
    Keyboard.dismiss();
    Modal.open(() => (
      <AddressScanner onRead={handleScannerReadResult} />
    ));
  };

  const handleSearchValidation = (searchQuery: string): ?string => {
    if (disableSelfSelect && searchQuery === activeAccountAddress) return t('error.cannotSendYourself');
    return null;
  };

  const openOptions = () => {
    Modal.open(() => (
      <SelectorOptions
        ref={optionsRef}
        title={optionsTitle || placeholder}
        options={options}
        searchPlaceholder={searchPlaceholder}
        optionKeyExtractor={({ name, value }) => name || value}
        horizontalOptionsData={horizontalOptionsData}
        onOptionSelect={onOptionSelect}
        noImageFallback={noOptionImageFallback}
        iconProps={hasQRScanner && {
          icon: 'qrcode',
          style: { fontSize: 20, marginTop: 2 },
          onPress: handleScannerOpen,
        }}
        validator={handleSearchValidation}
        allowEnteringCustomAddress={allowEnteringCustomAddress}
        onCustomOptionSet={onCustomOptionSet}
        customOptionButtonLabel={customOptionButtonLabel}
        customOptionButtonOnPress={customOptionButtonOnPress}
      />
    ));
  };

  const renderOption = (option: ?Option, disabled: boolean) => {
    if (!option) return null;
    const {
      name,
      imageUrl,
      lastUpdateTime,
      imageSource,
    } = option;

    const onItemPress = (itemImagePress: boolean = false) => {
      if (itemImagePress) {
        onOptionImagePress(option);
        return;
      }
      onOptionSelect(option);
    };

    return (
      <ListItemWithImage
        label={name}
        disabled={disabled}
        onPress={() => !disabled && openOptions()}
        avatarUrl={imageUrl}
        navigateToProfile={() => onItemPress(true)}
        imageUpdateTimeStamp={lastUpdateTime}
        itemImageSource={imageSource}
        padding="0 14px"
      />
    );
  };

  const hasValue = !isEmpty(selectedOption);
  const hasOptions = !!options?.length;
  const disabled = !hasOptions && !allowEnteringCustomAddress;
  const placeholderText = !disabled
    ? t('ellipsedString', { string: placeholder })
    : t('label.noOptionsToSelect');

  return (
    <>
      <Wrapper style={wrapperStyle}>
        <MediumText regular accent>{label}: </MediumText>
        <SelectedOption disabled={disabled} onPress={() => openOptions()}>
          {hasValue && renderOption(selectedOption, disabled)}
          {!hasValue && (
            <MediumText style={{ paddingHorizontal: spacing.layoutSides }} big>
              {placeholderText}
            </MediumText>
          )}
        </SelectedOption>
      </Wrapper>
      {children}
    </>
  );
};

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default connect(structuredSelector)(Selector);
