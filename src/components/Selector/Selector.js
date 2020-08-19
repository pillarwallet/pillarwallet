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

import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// components
import { MediumText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SelectorOptions from 'components/SelectorOptions';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// utils
import { spacing } from 'utils/variables';
import { isValidAddress } from 'utils/validators';

// types
import type { HorizontalOption, Option } from 'models/Selector';


export type Props = {
  selectedOption?: ?Option,
  onOptionSelect?: (option: Option, onSuccess?: () => void) => void | Promise<void>,
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
};

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
  onOptionSelect,
  disableSelfSelect,
  activeAccountAddress,
  onOptionImagePress,
  label = 'Select',
  placeholder = 'Choose option',
  optionsTitle,
  options,
  searchPlaceholder = 'Search',
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
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const handleScannerReadResult = (address: string) => {
    if (isValidAddress(address)) {
      const option = {
        value: address,
        ethAddress: address,
        name: address,
      };
      if (onOptionSelect) onOptionSelect(option);
      setIsOptionsVisible(false);
    }
    setIsScannerVisible(false);
  };

  const handleScannerOpen = () => {
    Keyboard.dismiss();
    setIsScannerVisible(true);
  };

  const handleSearchValidation = (searchQuery: string): ?string => {
    if (disableSelfSelect && searchQuery === activeAccountAddress) return 'Sorry, you cannot send to yourself. Please use a different address.';
    return null;
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
      if (itemImagePress && onOptionImagePress) {
        onOptionImagePress(option);
        return;
      }
      if (onOptionSelect) onOptionSelect(option);
      setIsOptionsVisible(false);
    };

    return (
      <ListItemWithImage
        label={name}
        disabled={disabled}
        onPress={() => !disabled && setIsOptionsVisible(true)}
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
  const placeholderText = !disabled ? `${placeholder}...` : 'no options to select';

  return (
    <>
      <Wrapper style={wrapperStyle}>
        <MediumText regular accent>{label}: </MediumText>
        <SelectedOption disabled={disabled} onPress={() => setIsOptionsVisible(true)}>
          {hasValue && renderOption(selectedOption, disabled)}
          {!hasValue && (
            <MediumText style={{ paddingHorizontal: spacing.layoutSides }} big>
              {placeholderText}
            </MediumText>
          )}
        </SelectedOption>
      </Wrapper>
      <SelectorOptions
        isVisible={isOptionsVisible}
        onHide={() => setIsOptionsVisible(false)}
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
      <AddressScanner
        isActive={isScannerVisible}
        onCancel={() => setIsScannerVisible(false)}
        onRead={handleScannerReadResult}
      />
      {children}
    </>
  );
};

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default connect(structuredSelector)(Selector);
