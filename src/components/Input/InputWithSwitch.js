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
import { Input } from 'native-base';
import get from 'lodash.get';

// utils
import { fontSizes, spacing, fontStyles, appFont } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { Event } from 'react-native';
import { FlatList } from 'react-native';
import type { ScrollToProps } from 'components/Modals/SlideModal';

// components
import { BaseText, MediumText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Switcher from 'components/Switcher';
import LabeledWrapper from 'components/Input/LabeledWrapper';
import VerifyView from 'components/Input/VerifyView';

// partials
import SelectList from './SelectList';

type InputProps = {
  fieldName: string,
  value?: string,
  onChange?: (value: any) => void,
  onSelect?: (value: any) => void,
  onBlur?: (field: string, value: ?string) => void,
};

type Option = {
  name: string,
};

type Props = {
  hasVerification?: boolean,
  isModified?: boolean,
  isVerified?: boolean,
  disabledInput?: ?boolean,
  inputType?: string,
  errorMessage?: ?string,
  inputProps: InputProps,
  hasSwitch?: boolean,
  label: string,
  wrapperStyle?: Object,
  options?: Option[],
  optionsTitle?: string,
  onPressVerify?: () => void,
};

type State = {
  showModal: boolean,
  contentOffsetY: number,
  containerHeight: number,
  contentContainerHeight: number,
};

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  align-content: center;
  padding: 0 ${spacing.layoutSides}px 0;
  border-bottom-color: ${({ hasErrors }) => hasErrors ? themedColors.negative : themedColors.tertiary};
  border-bottom-width: 1px;
  height: 60px;
`;

const Wrapper = styled.View`
  width: 100%;
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
  font-size: ${fontSizes.big}px;
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


export default class InputWithSwitch extends React.Component<Props, State> {
  scrollViewRef: React.ElementRef<FlatList>;

  constructor(props: Props) {
    super(props);
    this.scrollViewRef = React.createRef();
    this.state = {
      showModal: false,
      contentOffsetY: 0,
      containerHeight: 0,
      contentContainerHeight: 0,
    };
  }

  handleBlur = () => {
    const {
      inputProps: {
        value,
        onBlur,
        fieldName,
      },
    } = this.props;

    if (onBlur) {
      onBlur(fieldName, value);
    }
  };

  handleChange = (e: Event) => {
    const { inputProps: { onChange } } = this.props;
    const { nativeEvent: { text } } = e;

    if (onChange) {
      onChange(text);
    }
  };

  selectOption = (value: string) => {
    const {
      inputProps: {
        onChange,
        onSelect,
        fieldName,
      },
    } = this.props;

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

  handleModalScrollTo = (p: ScrollToProps) => {
    if (!p || !this.scrollViewRef) return;
    this.scrollViewRef.scrollToOffset({ animated: false, offset: p.y });
  };

  handleListOnScroll = (event: Object) => {
    const contentOffsetY = get(event, 'nativeEvent.contentOffset.y');
    this.setState({ contentOffsetY });
  };

  onListLayout = (event: Object) => {
    const { containerHeight } = this.state;
    const { height } = event.nativeEvent.layout;
    if (!containerHeight || containerHeight !== height) {
      this.setState({ containerHeight: height });
    }
  };

  onContentSizeChange = (width: number, height: number) => {
    this.setState({ contentContainerHeight: height });
  };

  render() {
    const {
      showModal,
      contentOffsetY,
      contentContainerHeight,
      containerHeight,
    } = this.state;

    const {
      disabledInput,
      errorMessage,
      hasVerification,
      hasSwitch,
      isVerified,
      inputProps,
      label,
      wrapperStyle,
      options,
      optionsTitle,
      onPressVerify,
      isModified,
    } = this.props;
    const { value = '' } = inputProps;
    const hasErrors = !!errorMessage;

    const isValueEmpty = !value || value.trim() === '';
    const showVerification = !!hasVerification && !hasErrors && !isValueEmpty && !isModified;

    const inputSection = options ? (
      <LabeledWrapper
        label={label}
        onPress={this.toggleModal}
      >
        <SelectedOption>{value}</SelectedOption>
      </LabeledWrapper>
    ) : (
      <LabeledWrapper label={label}>
        <ItemValue
          {...inputProps}
          disabled={disabledInput}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          numberOfLines={1}
          value={value}
        />
      </LabeledWrapper>
    );

    return (
      <Wrapper style={wrapperStyle}>
        <StyledItemView hasErrors={hasErrors}>
          {inputSection}
          {showVerification &&
            <VerifyView isVerified={!!isVerified} onPress={onPressVerify} />}
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
          handleScrollTo={this.handleModalScrollTo}
          scrollOffsetMax={contentContainerHeight && containerHeight ? contentContainerHeight - containerHeight : null}
          scrollOffset={contentOffsetY}
          propagateSwipe
        >
          <Wrapper flex={1}>
            {!!optionsTitle &&
            <ModalTitle extraHorizontalSpacing>
              {optionsTitle}
            </ModalTitle>}
            <SelectList
              options={options || []}
              onSelect={this.selectOption}
              flatListProps={{
                ref: (ref) => { this.scrollViewRef = ref; },
                scrollEventThrottle: 16,
                onScroll: this.handleListOnScroll,
                onLayout: this.onListLayout,
                onContentSizeChange: this.onContentSizeChange,
              }}
              customClickable
            />
          </Wrapper>
        </SlideModal>
      </Wrapper>
    );
  }
}
