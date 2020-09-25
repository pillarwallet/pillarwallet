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
import {
  View,
  TextInput,
  Keyboard,
  FlatList,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';

import { BaseText, MediumText } from 'components/Typography';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ProfileImage from 'components/ProfileImage';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Tabs from 'components/Tabs';

import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { images } from 'utils/images';
import { getMatchingSortedData } from 'utils/textInput';
import { isValidAddress } from 'utils/validators';

import type { Theme } from 'models/Theme';
import type { HorizontalOption, Option, OptionTabs } from 'models/Selector';


type Props = {
  horizontalOptionsData?: HorizontalOption[],
  showOptionsTitles?: boolean,
  renderOption?: (option: Option, onSelect: (option: Option) => void) => void,
  onHide?: () => void,
  onOptionSelect?: (option: Option, onSuccess: () => void) => void,
  optionKeyExtractor?: (item: Object) => string,
  isVisible: boolean,
  title: string,
  options?: Option[],
  optionTabs?: OptionTabs[],
  optionsTitle?: string,
  searchPlaceholder?: string,
  theme: Theme,
  noImageFallback?: boolean,
  inputIconName?: string,
  iconProps?: Object,
  activeAccountAddress: string,
  onHidden: () => void,
  validator?: (value: string) => string,
  allowEnteringCustomAddress?: boolean,
  forceTab?: string,
  customOptionButtonLabel?: string,
  customOptionButtonOnPress?: (option: Option) => void,
  onCustomOptionSet?: (option: Option) => void,
};

type State = {
  query: ?string,
  hasSearchError: boolean,
  customAddressAsAnOption: ?Option,
  activeTab: ?string,
};


const DIAMETER = 64;

const OptionsHeader = styled(MediumText)`
  margin: ${spacing.large}px ${spacing.layoutSides}px 0;
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

const HorizontalOptions = styled.View`
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${themedColors.border};
  padding-bottom: ${spacing.small}px;
`;

const HorizontalOptionItem = styled.TouchableOpacity`
  align-items: center;
  width: 90px;
  padding-top: ${spacing.medium}px;
`;

const HorizontalOptionItemName = styled(BaseText)`
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
  padding: 0 4px;
  margin-top: 8px;
`;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const SearchBarWrapper = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.layoutSides}px 0;
`;

const IconCircle = styled.View`
  width: ${DIAMETER}px;
  height: ${DIAMETER}px;
  border-radius: ${DIAMETER / 2}px;
  background-color: ${themedColors.tertiary};
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
`;

const IconImage = styled(CachedImage)`
  height: ${DIAMETER}px;
  width: ${DIAMETER}px;
`;


const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const MIN_QUERY_LENGTH = 2;


class SelectorOptions extends React.Component<Props, State> {
  searchInput: TextInput;

  constructor(props) {
    super(props);
    this.state = {
      query: null,
      customAddressAsAnOption: null,
      hasSearchError: false,
      activeTab: this.props.optionTabs ? this.props.optionTabs[0]?.id : null,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { activeTab } = this.state;
    const { optionTabs } = this.props;
    if (!activeTab && !prevProps.optionTabs && optionTabs && !!optionTabs.length) {
      this.setActiveTab(optionTabs[0]?.id);
    }
  }

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  handleSearch = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();
    this.setState({
      query: formattedQuery,
    });
  };

  handleInputChange = (query: string) => {
    const { allowEnteringCustomAddress } = this.props;
    this.handleSearch(query);
    if (allowEnteringCustomAddress) this.handleCustomAddress(query);
  };

  handleCustomAddress = (query: string) => {
    const isValid = isValidAddress(query);
    const address = (isValid && query) ? query : null;
    this.handleCustomAddressAsAnOption(address);
  };

  handleCustomAddressAsAnOption = (address: ?string) => {
    const { customAddressAsAnOption } = this.state;
    if (!customAddressAsAnOption && !address) return;
    if (!!customAddressAsAnOption && !address) {
      this.setState({ customAddressAsAnOption: null });
      return;
    }
    if (address) this.addCustomOption(address);
  };

  addCustomOption = (address) => {
    let option = {
      value: address,
      name: address,
      ethAddress: address,
    };
    const { customOptionButtonLabel, customOptionButtonOnPress, onCustomOptionSet } = this.props;
    if (customOptionButtonLabel && customOptionButtonOnPress) {
      option = {
        ...option,
        buttonActionLabel: customOptionButtonLabel,
        buttonAction: () => customOptionButtonOnPress(option),
      };
    }
    this.setState({ customAddressAsAnOption: option }, () => {
      if (onCustomOptionSet) onCustomOptionSet(option);
    });
  };

  renderHorizontalOptions = (horizontalOptionsData) => {
    const { showOptionsTitles } = this.props;
    if (!horizontalOptionsData) return null;

    return horizontalOptionsData.map((optionsInfo: HorizontalOption, index) => {
      const { title, data } = optionsInfo;
      if (!data?.length) return null;
      return (
        <HorizontalOptions key={title || index.toString()}>
          {(showOptionsTitles && !!title) && <OptionsHeader>{title}</OptionsHeader>}
          <FlatList
            data={data}
            keyExtractor={({ value, id }) => value || id}
            keyboardShouldPersistTaps="always"
            renderItem={this.renderHorizontalOption}
            horizontal
            contentContainerStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.medium }}
            ItemSeparatorComponent={() => <View style={{ width: 2, height: 1 }} />}
          />
        </HorizontalOptions>
      );
    });
  };

  renderHorizontalOption = ({ item }) => {
    const { theme } = this.props;
    const {
      value,
      name,
      imageUrl,
      imageSource,
    } = item;
    const { genericToken } = images(theme);

    return (
      <HorizontalOptionItem
        key={value}
        onPress={() => this.selectValue(item)}
      >
        {imageSource
        ?
          <IconCircle>
            <IconImage
              source={imageSource}
              resizeMode="cover"
            />
          </IconCircle>
        :
          <ProfileImage
            uri={imageUrl}
            userName={name}
            diameter={DIAMETER}
            textStyle={{ fontSize: fontSizes.medium }}
            noShadow
            borderWidth={0}
            fallbackImage={genericToken}
          />
          }
        <HorizontalOptionItemName numberOfLines={1}>{name}</HorizontalOptionItemName>
      </HorizontalOptionItem>
    );
  };

  renderOption = ({ item: option }: Object) => {
    if (option?.value === 'extendedHeaderItems') {
      return option.component;
    }
    const { renderOption, noImageFallback } = this.props;

    if (renderOption) {
      return renderOption(option, () => this.selectValue(option));
    }
    if (!option) return null;

    const {
      name,
      imageUrl,
      imageSource,
      opacity,
      disabled,
    } = option;

    return (
      <ListItemWithImage
        onPress={!disabled ? () => this.selectValue(option) : null}
        label={name}
        itemImageUrl={imageUrl}
        iconSource={imageSource}
        fallbackToGenericToken={!noImageFallback}
        wrapperOpacity={opacity}
        {...option}
      />
    );
  };

  resetOptions = () => {
    const { onHidden } = this.props;
    this.setState({ query: null }, () => {
      if (onHidden) onHidden();
    });
  };

  closeOptions = () => {
    const { onHide } = this.props;
    this.setState({ query: null }, () => {
      Keyboard.dismiss();
      if (onHide) onHide();
    });
  };

  selectValue = (selectedValue) => {
    const { onOptionSelect } = this.props;
    if (onOptionSelect) onOptionSelect(selectedValue, this.closeOptions);
  };

  optionKeyExtractor = (option) => {
    const { optionKeyExtractor } = this.props;
    if (optionKeyExtractor) {
      return optionKeyExtractor(option);
    }
    return option.value;
  };

  validateSearch = (val: string) => {
    const { validator } = this.props;
    const { hasSearchError } = this.state;
    if (!validator) return null;
    const hasError = validator(val);
    if (hasError) {
      this.setState({ hasSearchError: !!hasError });
      return hasError;
    } else if (hasSearchError) {
      this.setState({ hasSearchError: false });
    }
    return null;
  };

  setActiveTab = (tabId) => {
    this.setState({ activeTab: tabId });
  };

  handleOptionsOpen = () => {
    const { forceTab } = this.props;
    this.focusInput();
    if (forceTab) this.setState({ activeTab: forceTab });
  };

  render() {
    const {
      isVisible,
      theme,
      title,
      options = [],
      optionTabs,
      showOptionsTitles,
      optionsTitle,
      horizontalOptionsData = [],
      searchPlaceholder,
      iconProps,
      allowEnteringCustomAddress,
    } = this.props;
    const {
      query,
      customAddressAsAnOption,
      hasSearchError,
      activeTab,
    } = this.state;
    const colors = getThemeColors(theme);
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;
    const updatedOptionTabs = !!optionTabs && optionTabs.length
      ? optionTabs.map(({ id, ...rest }) => ({ ...rest, onPress: () => this.setActiveTab(id), id }))
      : [];

    const activeTabInfo = optionTabs && optionTabs.find(({ id }) => id === activeTab);
    const activeTabOptions = activeTabInfo?.options;
    const relatedOptions = activeTabOptions || options || [];

    const filteredOptions = isSearching ? getMatchingSortedData(relatedOptions, query) : relatedOptions;
    const filteredHorizontalOptionsData = isSearching && horizontalOptionsData.length
      ? horizontalOptionsData.reduce((mappedInfo, info) => {
        const { data } = info;
        if (data.length) {
          mappedInfo.push({ ...info, data: getMatchingSortedData(data, query) });
        }
        return mappedInfo;
      }, [])
      : horizontalOptionsData;

    const showEmptyState = !customAddressAsAnOption && !filteredOptions?.length
      && !filteredHorizontalOptionsData.some(({ data }) => data.length);
    const emptyStateMessage = allowEnteringCustomAddress ? t('error.invalid.address') : t('label.nothingFound');

    const extendedHeaderItems = {
      value: 'extendedHeaderItems', /* eslint-disable-line i18next/no-literal-string */
      component: (
        <>
          {this.renderHorizontalOptions(filteredHorizontalOptionsData)}
          {!!showOptionsTitles && !!optionsTitle &&
          <OptionsHeader>{optionsTitle}</OptionsHeader>}
          {showEmptyState &&
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph title={emptyStateMessage} />
          </EmptyStateWrapper>
          }
        </>),
    };

    let allFeedListData = [extendedHeaderItems];
    if (filteredOptions.length) {
      allFeedListData = [extendedHeaderItems, ...filteredOptions];
    } else if (!hasSearchError && customAddressAsAnOption) {
      allFeedListData = [extendedHeaderItems, customAddressAsAnOption];
    }

    return (
      <SlideModal
        isVisible={isVisible}
        fullScreen
        onModalShow={this.handleOptionsOpen}
        onModalHidden={this.resetOptions}
        noSwipeToDismiss
        noClose
        backgroundColor={colors.card}
      >
        <ContainerWithHeader
          headerProps={{
            noPaddingTop: true,
            customOnBack: this.closeOptions,
            centerItems: [{ title }],
          }}
        >
          <FlatList
            stickyHeaderIndices={[0]}
            data={allFeedListData}
            renderItem={this.renderOption}
            keyExtractor={this.optionKeyExtractor}
            keyboardShouldPersistTaps="always"
            initialNumToRender={10}
            viewabilityConfig={viewConfig}
            ListHeaderComponent={
              <>
                <SearchBarWrapper>
                  <SearchBar
                    inputProps={{
                      onChange: this.handleInputChange,
                      value: query,
                      autoCapitalize: 'none',
                      validator: this.validateSearch,
                    }}
                    placeholder={searchPlaceholder}
                    inputRef={ref => { this.searchInput = ref; }}
                    noClose
                    marginBottom="0"
                    iconProps={iconProps}
                  />
                </SearchBarWrapper>
                {!!optionTabs && <Tabs
                  tabs={updatedOptionTabs}
                  wrapperStyle={{ paddingTop: 16 }}
                  activeTab={activeTab || updatedOptionTabs[0].name}
                />}
              </>}
            windowSize={10}
            hideModalContentWhileAnimating
          />
        </ContainerWithHeader>
      </SlideModal>
    );
  }
}

export default withTheme(SelectorOptions);
