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
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { MediumText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SelectorOptions from 'components/SelectorOptions';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';

import { spacing } from 'utils/variables';

import type { HorizontalOption, Option } from 'models/Selector';
import { activeAccountAddressSelector } from 'selectors';


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
};

type State = {
  areOptionsVisible: boolean,
  isScanning: boolean,
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

class Selector extends React.Component<Props, State> {
  switchBetweenModals: boolean;

  state = {
    areOptionsVisible: false,
    isScanning: false,
  };

  closeOptions = () => {
    this.switchBetweenModals = false;
    this.setState({ areOptionsVisible: false });
  };

  openOptions = () => {
    this.setState({ areOptionsVisible: true });
  };

  handleOptionsHidden = () => {
    if (this.switchBetweenModals) this.setState({ isScanning: true });
  };

  onOptionSelect = (option: Option, onSuccess: () => void) => {
    const { onOptionSelect } = this.props;
    if (onOptionSelect) onOptionSelect(option, onSuccess);
  };

  renderOption = (option: ?Option, onPress?: () => void) => {
    if (!option) return null;
    const { onOptionImagePress } = this.props;
    const {
      name,
      imageUrl,
      lastUpdateTime,
      imageSource,
    } = option;

    return (
      <ListItemWithImage
        label={name}
        onPress={onPress}
        avatarUrl={imageUrl}
        navigateToProfile={onOptionImagePress ? () => onOptionImagePress(option) : onPress}
        imageUpdateTimeStamp={lastUpdateTime}
        itemImageSource={imageSource}
        padding="0 14px"
      />
    );
  };

  handleQRRead = (address: string) => {
    const { onOptionSelect } = this.props;
    const option = {
      value: address,
      ethAddress: address,
      name: address,
    };
    if (onOptionSelect) onOptionSelect(option);
    this.closeOptions();
  };

  handleScannerOpen = () => {
    this.switchBetweenModals = true;
    Keyboard.dismiss();
    this.setState({ areOptionsVisible: false });
  };

  handleQRScannerHidden = () => {
    if (this.switchBetweenModals) this.openOptions();
    this.switchBetweenModals = false;
  };

  handleQRScannerCancel = () => {
    this.setState({ isScanning: false });
  };

  handleSearchValidation = (val) => {
    const { disableSelfSelect, activeAccountAddress } = this.props;
    if (disableSelfSelect) {
      if (val === activeAccountAddress) {
        return 'Can not send to yourself';
      }
    }
    return null;
  };

  render() {
    const {
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
    } = this.props;
    const { areOptionsVisible, isScanning } = this.state;
    const hasValue = !isEmpty(selectedOption);
    const hasOptions = !!options?.length;
    const disabled = !hasOptions && !allowEnteringCustomAddress;
    const placeholderText = !disabled ? `${placeholder}...` : 'no options to select';

    return (
      <>
        <Wrapper style={wrapperStyle}>
          <MediumText regular accent>{label}: </MediumText>
          <SelectedOption onPress={this.openOptions} disabled={disabled}>
            {hasValue
              ? this.renderOption(selectedOption, this.openOptions)
              : <MediumText big style={{ paddingHorizontal: spacing.layoutSides }}>{placeholderText}</MediumText>}
          </SelectedOption>
        </Wrapper>
        <SelectorOptions
          isVisible={areOptionsVisible}
          onHide={this.closeOptions}
          onHidden={this.handleOptionsHidden}
          title={optionsTitle || placeholder}
          options={options}
          searchPlaceholder={searchPlaceholder}
          optionKeyExtractor={({ name, value }) => name || value}
          horizontalOptionsData={horizontalOptionsData}
          onOptionSelect={this.onOptionSelect}
          noImageFallback={noOptionImageFallback}
          iconProps={hasQRScanner && {
            icon: 'qrcode',
            style: { fontSize: 20, marginTop: 2 },
            onPress: this.handleScannerOpen,
          }}
          validator={this.handleSearchValidation}
          allowEnteringCustomAddress={allowEnteringCustomAddress}
        />
        <AddressScanner
          isActive={isScanning}
          onCancel={this.handleQRScannerCancel}
          onRead={this.handleQRRead}
          onModalHidden={this.handleQRScannerHidden}
        />
      </>
    );
  }
}

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default connect(structuredSelector)(Selector);
