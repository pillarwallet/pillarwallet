// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Input, Label } from 'native-base';
import { TextLink, BaseText } from 'components/Typography';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import { Image as RNImage, Platform } from 'react-native';

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

type EventLike = {
  nativeEvent: Object,
}

const Wrapper = styled.View`
  margin: 20px 0 20px;
`;

const Item = styled.View`
  height: 60px;
  flex: 2;
  display: flex;
`;

const InputHolder = styled.View`
  display: flex;
  flex-direction: row;
`;

const FloatImage = styled(RNImage)`
  position: absolute;
  height: 30px;
  width: 30px;
  left: 14px;
  top: 14px;
  tintColor: black;
  resizeMode: contain;
`;

const ImageHolder = styled.TouchableOpacity`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 0 10px 0 20px;
`;

const Image = styled(RNImage)`
  height: 24px;
  width: 24px;
  margin-bottom: 5px;
`;

const OutterImageText = styled(TextLink)`
  text-align: left;
`;

const ErrorMessage = styled(BaseText)`
  color: tomato;
  display: flex;
  justify-content: flex-end;
  text-align: left;
  height: 30px;
`;

const InputField = styled(Input)`
  font-size: ${props => props.fontSize || fontSizes.extraExtraLarge};
  font-weight: ${props => props.fontWeight || fontWeights.bold}
  text-align: ${props => props.textAlign || 'right'};
  background: #FFFFFF;
  color: ${UIColors.defaultTextColor};
  border: ${props => `1px solid ${props.error ? 'tomato' : '#EBEBEB'}`};
  border-radius: 4;
  padding: 0 12px;
`;

class SingleInput extends React.Component<Props, *> {
  static defaultProps = {
    inputType: 'default',
    innerImageURI: '',
    outterImageText: '',
    trim: true,
  };

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }
    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    if (onBlur) {
      onBlur(value);
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    onChange(value);
  };

  resolveAssetSource(uri: string | number) {
    if (typeof uri === 'number') return uri;
    return {
      uri,
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
    const { value = '' } = inputProps;
    return (
      <Wrapper>
        {label && <Label>{label}</Label>}
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <InputHolder>
          <Item>
            <InputField
              {...inputProps}
              error={!!errorMessage}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              value={value}
              style={{ paddingLeft: innerImageURI ? 54 : 12 }}
              placeholderTextColor={baseColors.mediumGray}
            />
            {!!innerImageURI && <FloatImage
              source={this.resolveAssetSource(innerImageURI)}
            />}
          </Item>
          {outterImageURI &&
            <ImageHolder onPress={onPress}>
              <Image source={this.resolveAssetSource(outterImageURI)} />
              <OutterImageText>{outterImageText.toUpperCase()}</OutterImageText>
            </ImageHolder>
          }
        </InputHolder>
      </Wrapper>
    );
  }
}

export default SingleInput;
