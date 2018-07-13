// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { Text, Animated, Keyboard } from 'react-native';

type inputPropsType = {
  placeholder?: string,
  onChange?: Function,
  onBlur?: Function,
  value: ?string,
}

type Props = {
  errorMessage?: string,
  inputProps: inputPropsType,

}

type State = {
  value: ?string,
  animFadeIn: Object,
  animShrink: Object,
}

type EventLike = {
  nativeEvent: Object,
}

const SearchHolder = styled.View`
  padding-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;


const CancelButton = styled.TouchableOpacity`
  margin: 0 5px 0 10px;
;`;

const cancelButtonWrapperStyles = {
  position: 'absolute',
  height: '100%',
  right: 0,
};

const animatedInputFieldStyles = {
  height: 40,
  borderWidth: 1,
  borderRadius: 20,
  borderColor: UIColors.defaultBorderColor,
  alignItems: 'center',
  justifyContent: 'space-around',
  flexDirection: 'row',
};

const InputField = styled.TextInput`
  flex: 1;
  height: 40px;
  padding-left: 14px;
`;

const InputIcon = styled(Icon)`
  flex: 0 0 20px;
  padding-right: 40px;
  font-size: ${fontSizes.large};
  color: ${baseColors.darkGray};
`;

class SearchBar extends React.Component<Props, State> {
  state = {
    value: '',
    animFadeIn: new Animated.Value(0),
    animShrink: new Animated.Value(100),
  };

  static defaultProps = {
    inputType: 'default',
    trim: true,
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.inputProps && nextProps.inputProps.value !== prevState.value) {
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

  handleBlur = (e: EventLike) => {
    const { inputProps: { onBlur } } = this.props;
    const value = e.nativeEvent.text;
    this.handleCancel();
    this.setState({ value }, () => {
      if (onBlur) {
        onBlur(value);
      }
    });
  };

  handleCancel = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(this.state.animFadeIn, {
        toValue: 0,
        duration: 200,
      }),
      Animated.timing(this.state.animShrink, {
        toValue: 100,
        duration: 250,
      }),
    ]).start();
  }

  handleFocus = () => {
    Animated.parallel([
      Animated.timing(this.state.animFadeIn, {
        toValue: 1,
        duration: 200,
      }),
      Animated.timing(this.state.animShrink, {
        toValue: 80,
        duration: 250,
      }),
    ]).start();
  }

  render() {
    const {
      inputProps,
    } = this.props;
    const { value, animFadeIn, animShrink } = this.state;
    return (
      <SearchHolder>
        <Animated.View
          style={{
            ...animatedInputFieldStyles,
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
            placeholder="Search or add new contact"
          />
          <InputIcon
            name="search"
          />
        </Animated.View>
        <Animated.View style={{ ...cancelButtonWrapperStyles, opacity: animFadeIn }}>
          <CancelButton onPress={this.handleCancel}>
            <Text style={{ color: baseColors.electricBlue }}>Cancel</Text>
          </CancelButton>
        </Animated.View>
      </SearchHolder>
    );
  }
}

export default SearchBar;
