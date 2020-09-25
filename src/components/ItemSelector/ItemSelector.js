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
import { View } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import get from 'lodash.get';
import t from 'translations/translate';

import { BaseText, MediumText } from 'components/Typography';
import ButtonText from 'components/ButtonText';
import SelectorOptions from 'components/SelectorOptions/SelectorOptions-old';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { noop } from 'utils/common';
import { images } from 'utils/images';
import { resolveAssetSource } from 'utils/textInput';

import type { Theme } from 'models/Theme';
import type { SelectorOptions as SelectorOptionsType } from 'models/TextInput';
import type { ItemSelectorType } from 'models/ItemSelector';

type Props = {
  errorMessage?: string,
  inputProps: ItemSelectorType,
  theme: Theme,
  selectorOptions?: SelectorOptionsType,
  renderOption?: (item: Object, selectOption: () => void) => React.Node,
  renderSelector?: (selector: Object) => React.Node,
  optionKeyExtractor?: (item: Object) => string,
  hasError?: boolean,
  activeTabOnItemClick?: string,
  activeTabOnOptionOpenClick?: string,
};

type State = {
  showOptionsSelector: boolean,
  forceTab: ?string,
};

const ErrorMessage = styled(BaseText)`
  color: ${themedColors.negative};
  width: 100%;
  margin-top: 10px;
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 2px;
  margin-bottom: 6px;
  margin-top: -4px;
`;

const Image = styled(CachedImage)`
  height: 164px;
  width: 164px;
  resize-mode: contain;
`;

const Selector = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ValueWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const Placeholder = styled(MediumText)`
  ${fontStyles.big};
  text-align: center;
`;

const SelectorValue = styled(MediumText)`
  ${fontStyles.big};
  margin-top: ${spacing.large}px;
`;

const InputLabel = styled(MediumText)`
  margin-bottom: 8px;
  color: ${themedColors.secondaryText};
`;

class ItemSelector extends React.Component<Props, State> {
  state = {
    showOptionsSelector: false,
    forceTab: '',
  };

  openSelector = (forceTab: ?string) => {
    this.setState({ forceTab, showOptionsSelector: true });
    const { inputProps } = this.props;
    const { onSelectorOpen } = inputProps;
    if (onSelectorOpen) onSelectorOpen();
  };

  closeSelector = () => {
    this.setState({ showOptionsSelector: false });
    const { inputProps } = this.props;
    const { onSelectorClose } = inputProps;
    if (onSelectorClose) onSelectorClose();
  };

  selectValue = (selectedValue: Object, onSuccess: () => void) => {
    const { inputProps: { onChange, selectorValue } } = this.props;
    const { input } = selectorValue;
    if (onChange) onChange({ selector: selectedValue, input });
    this.setState({ showOptionsSelector: false });
    if (onSuccess) onSuccess();
  };

  renderSelector = () => {
    const { theme, inputProps, selectorOptions = {} } = this.props;
    const { genericToken } = images(theme);

    const selector = get(inputProps, 'selectorValue.selector', {});
    const { icon: selectedOptionIcon, iconFallback: selectedOptionFallback, name: selectedValue } = selector;

    if (!selectedValue) {
      return <Placeholder>{selectorOptions.selectorPlaceholder || t('label.select')}</Placeholder>;
    }

    const optionImageSource = resolveAssetSource(selectedOptionIcon);
    return (
      <ValueWrapper>
        <Image
          key={selectedValue}
          source={optionImageSource}
          fallbackSource={selectedOptionFallback || genericToken}
          resizeMode="contain"
        />
        <SelectorValue>{selectedValue}</SelectorValue>
      </ValueWrapper>
    );
  };

  optionKeyExtractor = (option) => {
    const { optionKeyExtractor } = this.props;
    if (optionKeyExtractor) {
      return optionKeyExtractor(option);
    }
    return option?.value;
  };

  renderInputHeader = () => {
    const { inputProps, activeTabOnOptionOpenClick } = this.props;
    const { label, optionsOpenText } = inputProps;

    if (!label && !optionsOpenText) return null;
    const justifyContent = optionsOpenText && !label ? 'flex-end' : 'space-between';

    return (
      <View style={{
        flexDirection: 'row',
        width: '100%',
        justifyContent,
      }}
      >
        {!!label && <InputLabel>{label}</InputLabel>}
        {!!optionsOpenText &&
          <ButtonText
            buttonText={optionsOpenText}
            onPress={() => this.openSelector(activeTabOnOptionOpenClick)}
            fontSize={fontSizes.regular}
          />
        }
      </View>
    );
  };

  render() {
    const { showOptionsSelector, forceTab } = this.state;
    const {
      errorMessage,
      selectorOptions = {},
      renderOption,
      activeTabOnItemClick,
    } = this.props;

    const {
      options = [],
      optionTabs,
      selectorModalTitle,
      optionsSearchPlaceholder,
      horizontalOptions,
    } = selectorOptions;

    const horizontalOptionsLength = !horizontalOptions ? 0 : horizontalOptions.reduce((sum, item) => {
      if (item.data?.length) sum += item.data?.length;
      return sum;
    }, 0);
    const optionsInTabsLength = !optionTabs ? 0 : optionTabs.reduce((sum, tab) => {
      if (tab.options?.length) sum += tab.options?.length;
      return sum;
    }, 0);

    const selectorOptionsCount = options.length + horizontalOptionsLength + optionsInTabsLength;
    const disabledSelector = selectorOptionsCount <= 1;

    return (
      <View style={{ minHeight: 120 }}>
        {this.renderInputHeader()}
        <Selector
          onPress={!disabledSelector ? () => this.openSelector(activeTabOnItemClick) : noop}
          disabled={disabledSelector}
        >
          {this.renderSelector()}
        </Selector>
        {!!errorMessage &&
        <InputFooter>
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </InputFooter>}
        <SelectorOptions
          isVisible={showOptionsSelector}
          onHide={this.closeSelector}
          title={selectorModalTitle}
          options={options}
          optionTabs={optionTabs}
          searchPlaceholder={optionsSearchPlaceholder}
          optionKeyExtractor={this.optionKeyExtractor}
          onOptionSelect={this.selectValue}
          renderOption={renderOption}
          horizontalOptionsData={horizontalOptions}
          forceTab={forceTab}
        />
      </View>
    );
  }
}

export default withTheme(ItemSelector);
