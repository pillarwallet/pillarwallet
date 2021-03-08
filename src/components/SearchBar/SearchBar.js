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
/* eslint-disable no-unused-expressions */

import * as React from 'react';
import { Animated, Dimensions, Keyboard } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/Typography';

// Utils
import { getColorByThemeOutsideStyled, getThemeColors, getThemeType } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { SyntheticEvent } from 'utils/types/react-native';
import type { Theme } from 'models/Theme';

// Local
import SearchInput, { type CommonComponentsProps } from './SearchInput';


type Props = {|
  ...CommonComponentsProps,
  marginTop?: number,
  marginBottom?: number,
  theme: Theme,
  showPasteButton?: boolean;
|};

type State = {|
  animShrink: Animated.Value,
  isFocused: boolean,
  errorMessage: string,
|};

const { width } = Dimensions.get('window');
const componentWidth = width - (2 * spacing.large);
const sideButtonWidth = 68;
const inputShrinkSize = ((componentWidth - sideButtonWidth) * 100) / componentWidth;

const getBorderColor = ({
  isFocused, error, colors, defaultColor,
}) => {
  if (error) return colors.secondaryAccent240;
  if (isFocused) return colors.basic000;
  return defaultColor;
};
class SearchBar extends React.Component<Props, State> {
  value: string;

  constructor(props: Props) {
    super(props);
    const { showPasteButton } = this.props;
    this.value = '';

    this.state = {
      animShrink: new Animated.Value(showPasteButton ? inputShrinkSize : 100),
      isFocused: false,
      errorMessage: '',
    };
  }

  static defaultProps = {
    inputType: 'default',
    trim: true,
  };

  componentDidUpdate() {
    // Validate value changes orginating from props
    if (this.props.inputProps.value !== this.value) {
      this.value = this.props.inputProps.value ?? '';
      this.validateInput(this.value);
    }
  }

  handleChange = (e: SyntheticEvent<any>) => {
    this.value = e.nativeEvent.text;

    const { onChange } = this.props.inputProps;
    onChange?.(this.value);

    this.validateInput(this.value);
  };

  validateInput = (value: string) => {
    const { validator } = this.props.inputProps;
    if (!validator) return;

    const error = validator(value);
    if (error) {
      this.setState({ errorMessage: error });
      return;
    }

    if (this.state.errorMessage) {
      this.setState({ errorMessage: '' });
    }
  };

  handleFocus = () => {
    const { onFocus } = this.props.inputProps;
    onFocus?.();
    this.setState({ isFocused: true });
    this.animateShowButton();
  };

  handleBlur = () => {
    const { onBlur } = this.props.inputProps;
    this.animateHideButtonIfNeeded();
    this.setState({ isFocused: false });
    onBlur?.();
  };

  handleCancel = () => {
    const { onChange } = this.props.inputProps;
    this.value = '';
    onChange?.(this.value);

    Keyboard.dismiss();
    this.handleBlur();
  };

  handlePaste = async () => {
    this.value = await Clipboard.getString();

    const { onChange } = this.props.inputProps;
    onChange?.(this.value);

    this.validateInput(this.value);
  };

  animateShowButton = () => {
    Animated.timing(this.state.animShrink, {
      toValue: inputShrinkSize,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  animateHideButtonIfNeeded = () => {
    const { showPasteButton } = this.props;
    if (this.value || showPasteButton) return;

    Animated.timing(this.state.animShrink, {
      toValue: 100,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  handleSubmit = () => {
    const { value, onChange } = this.props.inputProps;
    onChange(value);
  };

  render() {
    const {
      inputProps,
      placeholder = t('label.search'),
      backgroundColor,
      marginTop,
      marginBottom,
      inputRef,
      showPasteButton,
      theme,
      iconProps,
    } = this.props;
    const { animShrink, isFocused, errorMessage } = this.state;
    const { value = '' } = inputProps;
    const colors = getThemeColors(theme);
    const currentTheme = getThemeType(theme);
    const defaultInputBackgroundColor = getColorByThemeOutsideStyled(currentTheme, {
      lightKey: 'basic060',
      darkKey: 'basic080',
    });

    const borderColor = getBorderColor({
      isFocused,
      error: !!errorMessage,
      colors,
      defaultColor: defaultInputBackgroundColor,
    });

    const customInputProps = {
      inputProps,
      isFocused,
      colors,
      backgroundColor: backgroundColor || defaultInputBackgroundColor,
      value,
      placeholder,
      inputRef,
      onFocus: this.handleFocus,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      handleSubmit: this.handleSubmit,
      borderColor,
    };

    const showCancelButton = isFocused || !!value;

    const animWidth = animShrink.interpolate({
      inputRange: [0, 100],
      outputRange: (['0%', '100%']: string[]),
    });

    return (
      <SearchHolder marginTop={marginTop} marginBottom={marginBottom}>
        <Row>
          <Animated.View style={{ width: animWidth }}>
            <SearchInput {...customInputProps} iconProps={iconProps} />
          </Animated.View>

          {showCancelButton && (
            <SideButton onPress={this.handleCancel}>
              <SideButtonTitle>{t('button.cancel')}</SideButtonTitle>
            </SideButton>
          )}

          {!showCancelButton && showPasteButton && (
            <SideButton onPress={this.handlePaste}>
              <SideButtonTitle>{t('button.paste')}</SideButtonTitle>
            </SideButton>
          )}
        </Row>

        {!!errorMessage && <Error>{errorMessage}</Error>}
      </SearchHolder>
    );
  }
}

export default withTheme(SearchBar);

const SearchHolder = styled.View`
  margin-bottom: ${(props) => props.marginBottom || 20}px;
  margin-top: ${(props) => props.marginTop || 0}px;
  display: flex;
  align-items: center;
`;

const Row = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SideButton = styled.TouchableOpacity`
  width: ${sideButtonWidth + spacing.large}px;
  align-items: flex-end;
  padding: ${spacing.small}px ${spacing.large}px;
  margin-right: -${spacing.large}px;
`;
const SideButtonTitle = styled(BaseText).attrs({
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
})`
  color: ${({ theme }) => theme.colors.basic000};
`;

const Error = styled(BaseText)`
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  margin-top: ${spacing.medium}px;
`;
