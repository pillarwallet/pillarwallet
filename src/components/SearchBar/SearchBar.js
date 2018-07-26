// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';
import { Animated, Keyboard, Platform, Image } from 'react-native';
import { BaseText } from 'components/Typography';

const SearchHolder = styled.View`
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CancelButton = styled.TouchableOpacity`
  margin-right: 10px;
`;

const animatedInputFieldStyles = {
  height: 40,
  borderWidth: 1,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'space-around',
  flexDirection: 'row',
  paddingRight: Platform.OS === 'ios' ? 30 : 36,
};

const InputField = styled.TextInput`
  flex: 1;
  height: 40px;
  padding-left: 14px;
  color: ${baseColors.slateBlack};
`;

const searchIcon = require('assets/icons/icon_search.png');

const InputIcon = styled(Image)`
  flex: 0 0 20px;
  position: absolute;
  right: 12px;
  top: 8px;
  width: 24;
  height: 24;
`;

type inputPropsType = {
  placeholder?: string,
  onChange?: Function,
  onBlur?: Function,
  value: ?string,
};

type Props = {
  errorMessage?: string,
  inputProps: inputPropsType,
  placeholder?: string,
};

type State = {
  value: ?string,
  animShrink: Object,
  isFocused: boolean,
};

type EventLike = {
  nativeEvent: Object,
};

class SearchBar extends React.Component<Props, State> {
  state = {
    value: '',
    animShrink: new Animated.Value(100),
    isFocused: false,
  };

  static defaultProps = {
    inputType: 'default',
    trim: true,
    placeholder: 'Search or add new contact',
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.inputProps.value !== prevState.value) {
      return {
        value: nextProps.inputProps.value,
      };
    }
    return null;
  }

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onChange) {
        onChange(value);
      }
    });
  };

  handleBlur = () => {
    const { inputProps: { onBlur } } = this.props;
    const { value } = this.state;
    if (!value) {
      this.hideKeyboard();
    }
    if (onBlur) {
      onBlur(value);
    }
    this.setState({ isFocused: false });
  };

  handleCancel = () => {
    const { inputProps: { onChange } } = this.props;
    const searchValue = '';
    if (onChange) {
      onChange(searchValue);
    }
    this.hideKeyboard();
  };

  hideKeyboard = () => {
    Animated.timing(this.state.animShrink, {
      toValue: 100,
      duration: 250,
    }).start();
    Keyboard.dismiss();
  };

  handleFocus = () => {
    this.setState({ isFocused: true });
    Animated.timing(this.state.animShrink, {
      toValue: 80,
      duration: 250,
    }).start();
  };

  render() {
    const { inputProps, placeholder } = this.props;
    const {
      value,
      animShrink,
      isFocused,
    } = this.state;

    return (
      <SearchHolder>
        <Animated.View
          style={{
            ...animatedInputFieldStyles,
            borderColor: isFocused ? UIColors.focusedBorderColor : UIColors.defaultBorderColor,
            width: animShrink.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '1%'],
            }),
          }}
        >
          <InputField
            onFocus={this.handleFocus}
            {...inputProps}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={UIColors.placeholderTextColor}
            underlineColorAndroid="transparent"
          />
          <InputIcon source={searchIcon} />
        </Animated.View>
        {(isFocused || !!value) &&
        <CancelButton onPress={this.handleCancel}>
          <BaseText style={{ color: baseColors.electricBlue }}>Cancel</BaseText>
        </CancelButton>
        }
      </SearchHolder>
    );
  }
}

export default SearchBar;
