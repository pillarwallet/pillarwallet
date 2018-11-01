// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Input, ActionSheet } from 'native-base';
import Icon from 'components/Icon';
import { TextLink, BaseText, MediumText } from 'components/Typography';
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
  innerImageText: string,
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
  optionsTitle?: string,
  optionsSelector?: Function,
  fontSize?: number,
  white?: boolean,
  marginTop?: number,
}

type EventLike = {
  nativeEvent: Object,
}

const themes = {
  default: {
    backgroundColor: baseColors.lightGray,
    borderColor: '#EBEBEB',
    borderWidth: '0',
    borderRadius: '6px',
  },
  white: {
    backgroundColor: baseColors.white,
    borderColor: baseColors.gallery,
    borderWidth: '1px',
    borderRadius: '4px',
  },
  withOptions: {
    backgroundColor: baseColors.alabaster,
    borderColor: baseColors.gallery,
    borderWidth: '1px',
    borderRadius: '4px',
  },
};

const getTheme = (props: Props) => {
  if (props.selectedOption) {
    return themes.withOptions;
  }
  if (props.white) {
    return themes.white;
  }
  return themes.default;
};

const Label = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
  padding-bottom: ${spacing.rhythm / 2}px;
`;

const Wrapper = styled.View`
  margin: ${props => props.marginTop || '0'}px 0 10px;
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
  height: 30px;
  width: 30px;
  tint-color: black;
  resize-mode: contain;
`;

const FloatImageView = styled.View`
  position: absolute;
  left: 12px;
  top: 11px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const InnerImageText = styled(BaseText)`
  color: ${UIColors.placeholderTextColor};
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
  width: 108px;
  padding: 0 18px 0 12px;
  bottom: 0;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: ${baseColors.aliceBlue}
  z-index: 2;
  left: 0;
  border: 1px solid ${props => props.error ? 'tomato' : '#ebebeb'};
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;
`;

const Image = styled(RNImage)`
  height: 24px;
  width: 24px;
  margin-bottom: 5px;
`;

const OutterImageText = styled(TextLink)`
  font-size: ${fontSizes.extraExtraSmall};
  text-align: left;
`;

const ErrorMessage = styled(BaseText)`
  color: tomato;
  display: flex;
  justify-content: flex-end;
  text-align: left;
  min-height: 30px;
  padding-bottom: ${spacing.rhythm / 2}px;
`;

const InputField = styled(Input)`
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraExtraLarge}px;
  font-weight: ${props => props.fontWeight ? props.fontWeight : fontWeights.bold};
  include-font-padding: false;
  text-align: ${props => props.textAlign || 'right'};
  background: ${props => props.theme.backgroundColor};
  border-radius: ${props => props.theme.borderRadius};
  color: ${UIColors.defaultTextColor};
  border-width: ${props => props.error ? '1px' : props.theme.borderWidth};
  border-color: ${props => props.error ? 'tomato' : props.theme.borderColor};
  padding: 0 12px;
  font-family: ${Platform.select({
    ios: 'Aktiv Grotesk App',
    android: 'sans-serif',
  })};
`;

const SelectedOptionWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const ChevronWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

class SingleInput extends React.Component<Props, *> {
  fieldValue: string = '';

  static defaultProps = {
    inputType: 'default',
    innerImageURI: '',
    outterImageText: '',
    innerImageText: '',
    trim: true,
    options: [],
  };

  handleBlur = () => {
    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? this.fieldValue.trim() : this.fieldValue;
    if (onBlur) {
      onBlur(value);
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    this.fieldValue = e.nativeEvent.text;
    onChange(this.fieldValue);
  };

  resolveAssetSource(uri: string | number) {
    if (typeof uri === 'number') return uri;
    return {
      uri,
    };
  }

  handleSelectPress = () => {
    const { options, optionsTitle = '', onSelect } = this.props;
    if (options.length < 2) return;
    const BUTTONS = options.map(({ label }) => label).concat('Cancel');
    const CANCEL_INDEX = options.length;
    // TODO: Move to custom ActionSheet similar to Toast ASAP.
    // Try/catch required to prevent show called on dismounted instance which throws an error.
    try {
      ActionSheet.show({
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        title: optionsTitle,
      }, index => {
        const { value } = options[index] || {};
        if (onSelect && value) onSelect(value);
      });
    } catch (e) { } //eslint-disable-line
  }

  renderSelector = () => {
    const {
      selectedOption,
      options,
      optionsSelector,
      errorMessage,
    } = this.props;
    return (
      <OptionSelector onPress={this.handleSelectPress} error={!!errorMessage}>
        <SelectedOptionWrapper>
          {!optionsSelector && <BaseText>{selectedOption}</BaseText>}
          {!!optionsSelector && !!selectedOption && optionsSelector(selectedOption)}
        </SelectedOptionWrapper>
        {options.length > 1 &&
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
        }
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
      innerImageText,
      onPress,
      options,
      fontSize,
      marginTop,
    } = this.props;
    const { value = '' } = inputProps;
    const theme = getTheme(this.props);
    return (
      <Wrapper marginTop={marginTop}>
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
              style={{ paddingLeft: innerImageURI ? 130 : 12 }}
              backgrounded={!!options.length}
              textAlignVertical="center"
              fontSize={fontSize}
              placeholderTextColor={baseColors.darkGray}
              theme={theme}
            />
            {!!innerImageURI &&
            <FloatImageView>
              <FloatImage
                source={this.resolveAssetSource(innerImageURI)}
              />
              {!!innerImageText &&
              <InnerImageText>{innerImageText}</InnerImageText>
              }
            </FloatImageView>
            }
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
