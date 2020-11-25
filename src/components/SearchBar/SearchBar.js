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
import styled, { withTheme } from 'styled-components/native';
import { Animated, Dimensions, Keyboard, TextInput as RNTextInput } from 'react-native';
import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import TextInput from 'components/Input';
import t from 'translations/translate';

import { fontSizes, appFont, spacing } from 'utils/variables';
import { getColorByThemeOutsideStyled, getThemeColors, getThemeType } from 'utils/themes';

import type { Theme, ThemeColors } from 'models/Theme';
import type { Event } from 'react-native';


type Value = ?string;

type InputPropsType = {
  placeholder?: string,
  backgroundColor?: string,
  onChange: (Value) => void,
  onBlur?: (Value) => void,
  onFocus?: () => void,
  value: Value,
  validator?: (val: string) => string,
};

type IconProps = {|
  icon: string,
  style?: Object,
  onPress?: () => void,
  persistIconOnFocus?: boolean,
|};

type CommonComponentsProps = {
  inputProps: InputPropsType,
  placeholder?: string,
  backgroundColor?: string,
  inputRef?: RNTextInput,
  inputIconName?: string,
  iconProps?: IconProps,
};

type Props = CommonComponentsProps & {
  marginTop?: number,
  marginBottom?: number | string, // if '0'
  customCloseAction?: Function,
  forceShowCloseButton?: boolean,
  theme: Theme,
  noClose?: boolean,
};

type State = {
  animShrink: Animated.Value,
  isFocused: boolean,
  errorMessage: string,
};

type SearchInputProps = CommonComponentsProps & {
  isFocused: boolean,
  colors: ThemeColors,
  value: ?string,
  onFocus: () => void,
  onChange: (e: Event) => void,
  onBlur: () => void,
  handleSubmit: () => void,
  borderColor: string,
};

const { width } = Dimensions.get('window');
const componentWidth = width - (spacing.large * 2);
const closeButtonWidth = 58;
const inputShrinkSize = ((componentWidth - closeButtonWidth) * 100) / componentWidth;

const SearchHolder = styled.View`
  margin-bottom: ${props => props.marginBottom || 20}px;
  margin-top: ${props => props.marginTop || 0}px;
  display: flex;
  align-items: center;
`;

const Row = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CancelButton = styled.TouchableOpacity`
  width: ${closeButtonWidth + spacing.large}px;
  align-items: flex-end;
  padding: ${spacing.small}px ${spacing.large}px;
  margin-right: -${spacing.large}px;
`;

const InputField = styled(TextInput)`
  flex: 1;
  height: 42px;
  padding: 10px;
  padding-left: ${({ needsExtraPadding }) => needsExtraPadding ? 40 : 14}px;
  padding-right: 16px;
  color: ${({ theme }) => theme.colors.basic010};
  font-size: ${fontSizes.regular}px;
  font-family: ${appFont.regular};
`;

const InputIcon = styled(IconButton)`
  flex: 0 0 20px;
  position: absolute;
  left: 10px;
  top: 7px;
`;

const InputWrapper = styled.View`
  height: 40px;
  border-width: 1px;
  border-color: ${({ borderColor }) => borderColor};
  border-radius: 20px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  width: 100%;
`;

const Error = styled(BaseText)`
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  margin-top: ${spacing.medium}px;
`;


const getBorderColor = ({
  isFocused, error, colors, defaultColor,
}) => {
  if (error) return colors.secondaryAccent240;
  if (isFocused) return colors.basic000;
  return defaultColor;
};

const SearchInput = (props: SearchInputProps) => {
  const {
    inputProps,
    isFocused,
    colors,
    backgroundColor,
    value,
    placeholder,
    inputRef,
    onFocus,
    onChange,
    onBlur,
    handleSubmit,
    iconProps = {},
    borderColor,
  } = props;

  const {
    icon,
    style: iconStyle = {},
    onPress,
    persistIconOnFocus,
  } = iconProps;
  const defaultOnIconPress = isFocused ? handleSubmit : onFocus;
  const onIconPress = onPress || defaultOnIconPress;
  const iconName = icon || 'search'; // eslint-disable-line i18next/no-literal-string
  const showIcon = persistIconOnFocus || !isFocused;

  return (
    <InputWrapper
      borderColor={borderColor}
      backgroundColor={backgroundColor}
    >
      <InputField
        {...inputProps}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        underlineColorAndroid="transparent"
        autoCorrect={false}
        innerRef={inputRef}
        needsExtraPadding={showIcon}
      />
      {showIcon &&
      <InputIcon
        icon={iconName}
        onPress={onIconPress}
        iconStyle={{
          width: 24,
          height: 24,
          color: colors.basic020,
          fontSize: 24,
          ...iconStyle,
        }}
      />}
    </InputWrapper>
  );
};

class SearchBar extends React.Component<Props, State> {
  value: string;

  constructor(props: Props) {
    super(props);
    const { forceShowCloseButton } = props;
    this.value = '';
    this.state = {
      animShrink: new Animated.Value(forceShowCloseButton ? inputShrinkSize : 100),
      isFocused: !!forceShowCloseButton,
      errorMessage: '',
    };
  }

  static defaultProps = {
    inputType: 'default',
    trim: true,
  };

  handleChange = (e: Event) => {
    const { inputProps: { onChange, validator } } = this.props;
    const { errorMessage } = this.state;
    this.value = e.nativeEvent.text;
    if (onChange) onChange(this.value);
    if (validator) {
      const error = validator(this.value);
      if (error) {
        this.setState({ errorMessage: error });
      } else if (errorMessage) {
        this.setState({ errorMessage: '' });
      }
    }
  };

  handleBlur = () => {
    const { inputProps: { onBlur }, forceShowCloseButton } = this.props;
    if (forceShowCloseButton) return;
    if (!this.value) {
      this.hideKeyboard();
    }
    if (onBlur) {
      onBlur(this.value);
    }
    Keyboard.dismiss();
    this.setState({ isFocused: false });
  };

  handleCancel = () => {
    const { inputProps: { onChange, onBlur } } = this.props;
    this.value = '';
    if (onChange) {
      onChange(this.value);
    }
    this.hideKeyboard();
    if (onBlur) {
      onBlur(this.value);
    }
    this.setState({ isFocused: false });
  };

  hideKeyboard = () => {
    Animated.timing(this.state.animShrink, {
      toValue: 100,
      duration: 250,
    }).start();
    Keyboard.dismiss();
  };

  handleFocus = () => {
    const { inputProps: { onFocus } } = this.props;
    if (onFocus) {
      onFocus();
    }
    this.setState({ isFocused: true });
    Animated.timing(this.state.animShrink, {
      toValue: inputShrinkSize,
      duration: 250,
    }).start();
  };

  handleSubmit = () => {
    const { inputProps: { onChange, value } } = this.props;
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
      customCloseAction,
      forceShowCloseButton,
      theme,
      noClose,
      iconProps,
    } = this.props;
    const { animShrink, isFocused, errorMessage } = this.state;
    const { value = '' } = inputProps;
    const colors = getThemeColors(theme);
    const currentTheme = getThemeType(theme);
    const defaultInputBackgroundColor = getColorByThemeOutsideStyled(currentTheme, {
      lightKey: 'basic060', darkKey: 'basic080',
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
      error: errorMessage,
      borderColor,
    };

    if (noClose) {
      return (
        <SearchHolder marginTop={marginTop} marginBottom={marginBottom}>
          <SearchInput {...customInputProps} iconProps={iconProps} />
          {!!errorMessage && <Error>{errorMessage}</Error>}
        </SearchHolder>
      );
    }

    return (
      <SearchHolder marginTop={marginTop} marginBottom={marginBottom}>
        <Row>
          <Animated.View
            style={{
              width: animShrink.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '1%'],
              }),
            }}
          >
            <SearchInput {...customInputProps} />
          </Animated.View>
          {(isFocused || !!value || forceShowCloseButton) &&
          <CancelButton onPress={customCloseAction || this.handleCancel}>
            <BaseText style={{ color: colors.basic000 }}>{t('button.close')}</BaseText>
          </CancelButton>
          }
        </Row>
        {!!errorMessage && <Error>{errorMessage}</Error>}
      </SearchHolder>
    );
  }
}

export default withTheme(SearchBar);
