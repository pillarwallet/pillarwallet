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

import React, { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import { MediumText, BaseText } from 'components/Typography';
import SelectorOptions from 'components/SelectorOptions/SelectorOptions-old';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// utils
import { isValidAddress } from 'utils/validators';
import { themedColors } from 'utils/themes';

// types
import type { HorizontalOption, Option } from 'models/Selector';


export type Props = {
  selectedOption?: ?Option,
  onOptionSelect?: (option: Option, onSuccess?: () => void) => void | Promise<void>,
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
  onModalsHidden?: () => void,
  hideModals?: boolean,
  resetOptionsModalOnHiddenOptionAdded?: boolean,
};

const SelectorPill = styled.TouchableOpacity`
  background-color: ${themedColors.tertiary};
  padding: 10px 16px;
  border-radius: 24px;
`;

const SelectedOption = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Selector = ({
  onOptionSelect,
  disableSelfSelect,
  activeAccountAddress,
  placeholder = t('label.choseOption'),
  optionsTitle,
  options,
  searchPlaceholder = t('label.search'),
  selectedOption,
  horizontalOptionsData,
  noOptionImageFallback,
  hasQRScanner,
  allowEnteringCustomAddress,
  children,
  customOptionButtonLabel,
  customOptionButtonOnPress,
  onCustomOptionSet,
  onModalsHidden,
  hideModals,
  resetOptionsModalOnHiddenOptionAdded,
}: Props) => {
  const [changingModals, setChangingModals] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  /**
   * reset options modal if set by resetOptionsModalOnHiddenOptionAdded prop:
   * options modal was force hidden when option value was set
   */
  useEffect(() => {
    if (resetOptionsModalOnHiddenOptionAdded
      && hideModals
      && isOptionsVisible
      && !isEmpty(selectedOption)) {
      setIsOptionsVisible(false);
    }
  }, [selectedOption]);

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
    setIsOptionsVisible(false);
    setChangingModals(true);
    setIsScannerVisible(true);
  };

  const handleSearchValidation = (searchQuery: string): ?string => {
    if (disableSelfSelect && searchQuery === activeAccountAddress) return t('error.cannotSendYourself');
    return null;
  };

  const renderOption = (option: ?Option) => {
    if (!option) return null;
    const {
      imageUrl,
      lastUpdateTime,
    } = option;
    let { name } = option;

    if (isValidAddress(name)) {
      name = t('ellipsedMiddleString', {
        stringStart: name.slice(0, 6),
        stringEnd: name.slice(-6),
      });
    }

    const updatedUserImageUrl = lastUpdateTime && imageUrl ? `${imageUrl}?t=${lastUpdateTime}` : imageUrl;

    return (
      <SelectedOption>
        <ProfileImage
          uri={updatedUserImageUrl}
          userName={name}
          diameter={16}
          noShadow
          borderWidth={0}
          initialsSize={10}
        />
        <Spacing w={8} />
        <MediumText medium>{name}</MediumText>
      </SelectedOption>
    );
  };

  const hasValue = !isEmpty(selectedOption);
  const hasOptions = !!options?.length;
  const disabled = !hasOptions && !allowEnteringCustomAddress;
  const placeholderText = !disabled
    ? placeholder
    : t('label.noOptionsToSelect');

  const onModalHidden = () => {
    setChangingModals(false);
    if (onModalsHidden) onModalsHidden();
  };

  return (
    <>
      <SelectorPill onPress={() => setIsOptionsVisible(true)} disabled={disabled}>
        {hasValue ? renderOption(selectedOption) : <BaseText link medium>{placeholderText}</BaseText>}
      </SelectorPill>
      <SelectorOptions
        isVisible={!hideModals && !changingModals && isOptionsVisible}
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
        onHidden={onModalHidden}
      />
      <AddressScanner
        isActive={!hideModals && !changingModals && isScannerVisible}
        onCancel={() => {
          setIsScannerVisible(false);
          setChangingModals(true);
          setIsOptionsVisible(true);
        }}
        onModalHidden={onModalHidden}
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
