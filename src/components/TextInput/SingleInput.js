// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Input, ActionSheet } from 'native-base';
import Icon from 'components/Icon';
import { TextLink, BaseText, LightText, MediumText } from 'components/Typography';
import { baseColors, UIColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { Image as RNImage, Platform } from 'react-native';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur?: Function,
  value: ?string,
  multiline?: boolean,
  fontSize?: number,
}

type Option = {
  value: string,
  label: string,
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
  onSelect?: Function,
  selectedOption?: string,
  errorMessage?: string,
  onPress?: Function,
  inputProps: inputPropsType,
  inputType: string,
  trim: boolean,
  options: Option[],
  fontSize?: number,
}

type EventLike = {
  nativeEvent: Object,
}

const Label = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
  padding-bottom: ${spacing.rhythm / 2}px;
`;

const Wrapper = styled.View`
  margin: 10px 0;
`;

const Item = styled.View`
  height: 52px;
  flex: 2;
  display: flex;
  position: relative;
`;

const InputHolder = styled.View`
  display: flex;
  flex-direction: row;
`;

const FloatImage = styled(RNImage)`
  position: absolute;
  height: 30px;
  width: 30px;
  left: 12px;
  top: 11px;
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

const OptionSelector = styled.TouchableOpacity`
  position: absolute;
  height: 100%;
  width: 80px;
  padding: 0 8px;
  bottom: 0;
  justify-content: space-around;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: ${baseColors.aliceBlue}
  z-index: 2;
  left: 0;
  border: 1px solid #ebebeb;
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;
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
  min-height: 30px;
  padding-bottom: ${spacing.rhythm / 2}px;;
`;

const InputField = styled(Input)`
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraExtraLarge}px;
  font-weight: ${props => props.fontWeight ? props.fontWeight : fontWeights.bold};
  include-font-padding: false;
  text-align: ${props => props.textAlign || 'right'};
  background: ${props => props.backgrounded ? baseColors.alabaster : baseColors.white};
  border-radius: 4;
  color: ${UIColors.defaultTextColor};
  border: ${props => `1px solid ${props.error ? 'tomato' : baseColors.gallery}`};
  padding: 0 12px;
  font-family: ${Platform.select({
    ios: 'Aktiv Grotesk App',
    android: 'sans-serif',
  })};
`;

const ChevronWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content; center;
`;

class SingleInput extends React.Component<Props, *> {
  static defaultProps = {
    inputType: 'default',
    innerImageURI: '',
    outterImageText: '',
    trim: true,
    options: [],
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

  handleSelectPress = () => {
    const { options, onSelect } = this.props;
    const BUTTONS = options.map(({ label }) => label).concat('Cancel');
    const CANCEL_INDEX = options.length;
    // TODO: Move to custom ActionSheet similar to Toast ASAP.
    // Try/catch required to prevent show called on dismounted instance which throws an error.
    try {
      ActionSheet.show({
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        title: 'Choose currency',
      }, index => {
        const { value } = options[index] || {};
        if (onSelect && value) onSelect(value);
      });
    } catch (e) { } //eslint-disable-line
  }

  renderSelector = () => {
    const { selectedOption } = this.props;
    return (
      <OptionSelector onPress={this.handleSelectPress}>
        <LightText>{selectedOption}</LightText>
        <ChevronWrapper>
          <Icon
            name="chevron-right"
            style={{
              fontSize: 8,
              transform: [{ rotate: '-90deg' }],
              color: baseColors.electricBlue,
            }}
          />
          <Icon
            name="chevron-right"
            style={{
              fontSize: 8,
              transform: [{ rotate: '90deg' }],
              color: baseColors.electricBlue,
              marginTop: 4,
            }}
          />
        </ChevronWrapper>
      </OptionSelector>
    );
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
      options,
      fontSize,
    } = this.props;
    const { value = '' } = inputProps;
    return (
      <Wrapper>
        {label && <Label>{label.toUpperCase()}</Label>}
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <InputHolder>
          <Item>
            {!!options.length && this.renderSelector()}
            <InputField
              {...inputProps}
              error={!!errorMessage}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              numberOfLines={1}
              value={value}
              style={{ paddingLeft: innerImageURI ? 54 : 12 }}
              placeholderTextColor={baseColors.mediumGray}
              backgrounded={!!options.length}
              textAlignVertical="center"
              fontSize={fontSize}
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
