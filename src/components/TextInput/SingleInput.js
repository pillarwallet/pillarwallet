// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Input, Label } from 'native-base';
import { TextLink } from 'components/Typography';
import { fontSizes, fontWeights } from 'utils/variables';
import FastImage from 'react-native-fast-image';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur?: Function,
  value: ?string,
  multiline?: boolean,
}

type Props = {
  icon?: string,
  inlineLabel?: boolean,
  alignRight?: boolean,
  postfix?: string,
  innerImageURI?: string,
  outterImageURI?: string,
  outterImageText: string,
  label?: string,
  id?: string,
  iconColor?: string,
  errorMessage?: string,
  onPress?: Function,
  inputProps: inputPropsType,
  inputType: string,
  trim: boolean,
}

type State = {
  value: ?string
}

type EventLike = {
  nativeEvent: Object,
}

const Wrapper = styled.View`
  margin: 40px 0 20px;
  display: flex;
  flex-direction: row;
`;

const InputHolder = styled.View`
  height: 60;
  flex: 2;
  display: flex;
`;

const FloatImage = styled(FastImage)`
  position: absolute;
  height: 30px;
  width: 30px;
  left: 14px;
  top: 14px;
`;

const ImageHolder = styled.TouchableOpacity`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 0 10px 0 20px;
`;

const Image = styled(FastImage)`
  height: 24px;
  width: 24px;
  margin-bottom: 5px;
`;

const OutterImageText = styled(TextLink)`
  text-align: left;
`;

const ErrorMessage = styled.Text`
  color: tomato;
  display: flex;
  justify-content: flex-end;
  text-align: right;
  height: 30px;
`;

const InputField = styled(Input)`
  font-size: ${props => props.fontSize || fontSizes.extraExtraLarge};
  font-weight: ${props => props.fontWeight || fontWeights.bold}
  text-align: ${props => props.textAlign || 'right'};
  background: #FFFFFF;
  border: ${props => `1px solid ${props.error ? 'tomato' : '#EBEBEB'}`};
  border-radius: 4;
  padding: 0 12px;
`;

class SingleInput extends React.Component<Props, State> {
  state = {
    value: '',
  };

  static defaultProps = {
    inputType: 'default',
    innerImageURI: '',
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

  handleBlur = (e: EventLike) => {
    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onBlur) {
        onBlur(value);
      }
    });
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onChange) {
        onChange(value);
      }
    });
  };

  resolveAssetSource(uri: string | number) {
    if (typeof uri === 'number') return uri;
    return {
      uri,
      priority: FastImage.priority.low,
    };
  }

  render() {
    const {
      label,
      inputProps,
      errorMessage,
      innerImageURI,
      outterImageURI,
      outterImageText,
      onPress,
    } = this.props;
    const { value } = this.state;
    return (
      <Wrapper>
        {label && <Label>{label}</Label>}
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <InputHolder>
          <InputField
            {...inputProps}
            error={!!errorMessage}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onEndEditing={this.handleBlur}
            value={value}
          />
          {innerImageURI && <FloatImage
            source={this.resolveAssetSource(innerImageURI)}
          />}
        </InputHolder>
        {outterImageURI &&
          (
            <ImageHolder onPress={onPress}>
              <Image
                source={this.resolveAssetSource(outterImageURI)}
              />
              <OutterImageText>{outterImageText.toUpperCase()}</OutterImageText>
            </ImageHolder>
          )}
      </Wrapper>
    );
  }
}

export default SingleInput;
