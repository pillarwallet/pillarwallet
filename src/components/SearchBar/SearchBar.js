// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { baseColors, fontSizes } from 'utils/variables';
import { View } from 'react-native';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  value: ?string,
}

type Props = {
  errorMessage?: string,
  inputProps: inputPropsType,

}

type State = {
  value: ?string
}

type EventLike = {
  nativeEvent: Object,
}

const ErrorMessage = styled.Text`
  color: tomato;
  flex: 1;
`;


const InputFieldWrapper = styled.View`
  height: 40px;
  border-width: 1px;
  border-radius: 20px;
  border-color: ${baseColors.mediumGray};
  align-items: center;
  justify-content: space-around;
  flex-direction: row;
`;

const InputField = styled.TextInput`
  flex: 1;
  height: 40px;
  padding: 0 20px;
`;

const InputIcon = styled(Icon)`
  flex: 0 0 20px;
  font-size: ${fontSizes.large};
  color: ${baseColors.darkGray};
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
  margin-top: 6px;
`;


class SearchBar extends React.Component<Props, State> {
  state = {
    value: '',
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

  render() {
    const {
      inputProps,
      errorMessage,
    } = this.props;
    const { value } = this.state;

    return (
      <View style={{ paddingBottom: 10 }}>

        <InputFieldWrapper>
          <InputField
            {...inputProps}
            onChange={this.handleChange}
            value={value}
          />
          <InputIcon
            name="search"
          />
        </InputFieldWrapper>
        <InputFooter>
          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : <View />}
        </InputFooter>
      </View>
    );
  }
}

export default SearchBar;
