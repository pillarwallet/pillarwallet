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
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { Input } from 'native-base';

import { fontSizes, spacing, fontStyles, appFont } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import SlideModal from 'components/Modals/SlideModal';
import Switcher from 'components/Switcher';
import SelectList from './SelectList';

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 9px ${spacing.large}px 0;
  background-color: ${themedColors.card};
  border-bottom-color: ${({ hasErrors, theme }) => hasErrors ? theme.colors.negative : theme.colors.border};
  border-top-color: ${({ hasErrors, theme }) => hasErrors ? theme.colors.negative : theme.colors.border};
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  height: 60px;
`;

const Wrapper = styled.View`
  width: 100%;
`;

const ItemLabelHolder = styled.View`
  height: 100%;
  flex: 1;
`;

const ItemLabel = styled(MediumText)`
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 6px;
`;

const ErrorMessage = styled(BaseText)`
  ${fontStyles.small};
  color: ${themedColors.negative};
  flex-wrap: wrap;
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const ItemValue = styled(Input)`
  color: ${themedColors.text};
  font-size: ${fontSizes.medium}px;
  flex-wrap: wrap;
  width:100%;
  padding: 0 0 9px;
  font-family: ${appFont.medium};
`;

const SelectedOption = styled(BaseText)`
  ${fontStyles.medium};
  flex-wrap: wrap;
  flex: 1;
  padding: 0 0 9px;
  width:100%;
`;

const VerifyView = styled.View`
  align-items: center;
  flex-direction: row;
`;

const VerifyLabel = styled(BaseText)`
  color: ${({ isVerified, theme }) => isVerified ? theme.colors.positive : theme.colors.primary};
  ${fontStyles.regular};
  margin: 0 4px 0;
`;

const ItemSelectHolder = styled.TouchableOpacity`
  flex: 1;
`;

const ItemAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: 15px;
`;

const ModalTitle = styled(MediumText)`
  ${fontStyles.big};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
`;

const CheckIcon = styled(Icon)`
  color: ${themedColors.positive};
  font-size: 8px;
  margin-left: 4px;
`;

type InputProps = {
  fieldName: string,
  value?: string,
  onChange?: Function,
  onSelect?: Function,
  onBlur?: Function,
};

type Option = {
  name: string
};

type Props = {
  hasVerification?: ?boolean,
  isVerified?: ?boolean,
  disabledInput?: ?boolean,
  inputType?: string,
  errorMessage?: ?string,
  inputProps: InputProps,
  hasSwitch?: boolean,
  label: string,
  wrapperStyle?: Object,
  options?: Option[],
  optionsTitle?: string,
};

type State = {
  showModal: boolean,
};

type EventLike = {
  nativeEvent: Object,
};

export default class InputWithSwitch extends React.Component<Props, State> {
  fieldValue: string = '';

  state = {
    showModal: false,
  };

  handleBlur = () => {
    const { inputProps: { onBlur, fieldName } } = this.props;
    const value = {};
    value[fieldName] = this.fieldValue;

    if (onBlur) {
      onBlur(value);
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    this.fieldValue = e.nativeEvent.text;

    if (onChange) {
      onChange(this.fieldValue);
    }
  };

  selectOption = (value: string) => {
    const { inputProps: { onChange, onSelect, fieldName } } = this.props;

    if (onChange) {
      onChange(value);
    }

    const valueObject = {};
    valueObject[fieldName] = value;

    if (onSelect) {
      onSelect(valueObject);
    }
    this.toggleModal();
  };

  toggleModal = () => {
    const { showModal } = this.state;
    this.setState({ showModal: !showModal });
  };

  render() {
    const { showModal } = this.state;
    const {
      disabledInput,
      errorMessage,
      hasVerification = false,
      hasSwitch = false,
      isVerified,
      inputProps,
      label,
      wrapperStyle,
      options = [],
      optionsTitle,
    } = this.props;
    const { value = '' } = inputProps;
    const hasErrors = !!errorMessage;

    const inputSection = options.length ? (
      <ItemSelectHolder
        onPress={this.toggleModal}
      >
        <ItemLabel>
          {label}
        </ItemLabel>
        <SelectedOption>{value}</SelectedOption>
      </ItemSelectHolder>
    ) : (
      <ItemLabelHolder>
        <ItemLabel>
          {label}
        </ItemLabel>
        <ItemValue
          disabled={disabledInput}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          numberOfLines={1}
          value={value}
        />
      </ItemLabelHolder>
    );

    return (
      <Wrapper style={wrapperStyle}>
        <StyledItemView
          hasErrors={hasErrors}
        >
          {inputSection}
          {hasVerification &&
          <VerifyView>
            <VerifyLabel isVerified={isVerified}>
              {isVerified ? 'Verified' : 'Verify'}
            </VerifyLabel>
            {isVerified && <CheckIcon name="check" />}
          </VerifyView>
          }

          {!!hasSwitch &&
          <ItemAddon>
            <Switcher
              onToggle={() => {}} // todo
              isOn={{}} // todo
            />
          </ItemAddon>}
        </StyledItemView>
        {!!errorMessage &&
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>}

        <SlideModal
          isVisible={showModal}
          fullScreen
          showHeader
          onModalHide={this.toggleModal}
          avoidKeyboard
        >
          <Wrapper flex={1}>
            {!!optionsTitle &&
            <ModalTitle extraHorizontalSpacing>
              {optionsTitle}
            </ModalTitle>}
            <SelectList options={options} onSelect={this.selectOption} />
          </Wrapper>
        </SlideModal>

      </Wrapper>
    );
  }
}
