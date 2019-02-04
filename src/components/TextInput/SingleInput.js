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
import { Platform } from 'react-native';
import { Input, ActionSheet } from 'native-base';
import Icon from 'components/Icon';
import { BaseText, MediumText } from 'components/Typography';
import { baseColors, UIColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { CachedImage } from 'react-native-cached-image';
import IconButton from 'components/IconButton';

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
  fallbackSource?: string,
  outterIcon?: string,
  outterIconText?: string,
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

const FloatImage = styled(CachedImage)`
  height: 30px;
  width: 30px;
  tint-color: black;
  resize-mode: contain;
`;

const FloatImageView = styled.View`
  position: absolute;
  left: 10px;
  top: 0;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  max-width: 100;
  height: 100%;
`;

const TextHolder = styled.View`
  flex-direction: row;
  align-items: center;
  width: 70%;
  height: 100%;
`;

const InnerImageText = styled(BaseText)`
  color: ${UIColors.placeholderTextColor};
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
  textAlignVertical: center;
  background: ${props => props.theme.backgroundColor};
  border-radius: ${props => props.theme.borderRadius};
  color: ${UIColors.defaultTextColor};
  border-width: ${props => props.error ? '1px' : props.theme.borderWidth};
  border-color: ${props => props.error ? 'tomato' : props.theme.borderColor};
  padding: 0 12px;  
  ${props => Platform.OS === 'ios' || props.value ? 'font-family: Aktiv Grotesk App;' : ''}
  ${props => Platform.OS === 'android' && props.fontSize ? `line-height: ${props.fontSize};` : ''}
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
  };

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
  };

  render() {
    const {
      label,
      inputProps,
      errorMessage,
      innerImageURI,
      fallbackSource,
      outterIcon,
      outterIconText,
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
                fallbackSource={fallbackSource}
              />
              {!!innerImageText &&
                <TextHolder>
                  <InnerImageText>= </InnerImageText>
                  <InnerImageText numberOfLines={2} ellipsizeMode="tail" >{innerImageText}</InnerImageText>
                </TextHolder>
              }
            </FloatImageView>
            }
          </Item>
          {outterIcon &&
          <IconButton
            icon="scan"
            color={baseColors.electricBlue}
            fontSize={fontSizes.extraLarge}
            onPress={onPress}
            iconText={outterIconText}
            style={{
              marginRight: 7,
              marginLeft: 22,
              marginBottom: 3,
              alignItems: 'center',
            }}
          />
          }
        </InputHolder>
      </Wrapper>
    );
  }
}

export default SingleInput;
