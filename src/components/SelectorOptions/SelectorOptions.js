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

import { BaseText, MediumText } from 'components/Typography';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ProfileImage from 'components/ProfileImage';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { images } from 'utils/images';
import { getMatchingSortedData } from 'utils/textInput';

import type { Theme } from 'models/Theme';
import type { HorizontalOption, Option } from 'models/Selector';


type Props = {
  horizontalOptionsData?: HorizontalOption[],
  showOptionsTitles?: boolean,
  renderOption?: (option: Option, onSelect: (option: Option) => void) => void,
  onHide?: () => void,
  onOptionSelect?: (option: Option) => void,
  optionKeyExtractor?: (item: Object) => string,
  isVisible: boolean,
  title: string,
  options: Option[],
  optionsTitle?: string,
  searchPlaceholder?: string,
  theme: Theme,
}

type State = {
  query: string,
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

  state = {
    query: '',
  };

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  handleSearch = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
  };

  renderHorizontalOptions = (horizontalOptionsData) => {
    const { showOptionsTitles } = this.props;
    if (!horizontalOptionsData) return null;

    return horizontalOptionsData.map((optionsInfo) => {
      const { title, data } = optionsInfo;
      if (!data?.length) return null;
      return (
        <HorizontalOptions>
          {(showOptionsTitles && !!title) &&
          <OptionsHeader>{title}</OptionsHeader>
          }
          <FlatList
            data={data}
            keyExtractor={({ value }) => value}
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
    if (option.value === 'extendedHeaderItems') {
      return option.component;
    }
    const { renderOption } = this.props;

    if (renderOption) {
      return renderOption(option, () => this.selectValue(option));
    }

    const {
      name,
      imageUrl,
      imageSource,
      customProps = {},
    } = option;

    return (
      <ListItemWithImage
        onPress={() => this.selectValue(option)}
        label={name}
        itemImageUrl={imageUrl}
        iconSource={imageSource}
        fallbackToGenericToken
        {...customProps}
      />
    );
  };

  resetOptions = () => {
    this.setState({ query: '' });
    Keyboard.dismiss();
  };

  closeOptions = () => {
    const { onHide } = this.props;
    this.resetOptions();
    if (onHide) onHide();
  };

  selectValue = (selectedValue: Option) => {
    const { onOptionSelect } = this.props;
    if (onOptionSelect) onOptionSelect(selectedValue);
    this.closeOptions();
  };

  optionKeyExtractor = (option) => {
    const { optionKeyExtractor } = this.props;
    if (optionKeyExtractor) {
      return optionKeyExtractor(option);
    }
    return option.value;
  };

  render() {
    const {
      isVisible,
      theme,
      title,
      options,
      showOptionsTitles,
      optionsTitle,
      horizontalOptionsData = [],
      searchPlaceholder,
    } = this.props;
    const { query } = this.state;
    const colors = getThemeColors(theme);
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;

    const filteredOptions = isSearching ? getMatchingSortedData(options, query) : options;
    const filteredHorizontalOptionsData = isSearching && horizontalOptionsData.length
      ? horizontalOptionsData.reduce((mappedInfo, info) => {
        const { data } = info;
        if (data.length) {
          mappedInfo.push({ ...info, data: getMatchingSortedData(data, query) });
        }
        return mappedInfo;
      }, [])
      : horizontalOptionsData;

    const showEmptyState = !filteredOptions?.length && !filteredHorizontalOptionsData.some(({ data }) => data.length);

    const extendedHeaderItems = {
      value: 'extendedHeaderItems',
      component: (
        <>
          {this.renderHorizontalOptions(filteredHorizontalOptionsData)}
          {!!showOptionsTitles && !!optionsTitle &&
          <OptionsHeader>{optionsTitle}</OptionsHeader>}
          {showEmptyState &&
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph title="Nothing found" />
          </EmptyStateWrapper>
          }
        </>),
    };

    let allFeedListData = [extendedHeaderItems];
    if (filteredOptions.length) {
      allFeedListData = [extendedHeaderItems, ...filteredOptions];
    }

    return (
      <SlideModal
        isVisible={isVisible}
        fullScreen
        onModalShow={this.focusInput}
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
              <SearchBarWrapper>
                <SearchBar
                  inputProps={{
                    onChange: this.handleSearch,
                    value: query,
                    autoCapitalize: 'none',
                  }}
                  placeholder={searchPlaceholder}
                  inputRef={ref => { this.searchInput = ref; }}
                  noClose
                  marginBottom="0"
                />
              </SearchBarWrapper>}
            windowSize={10}
            hideModalContentWhileAnimating
          />
        </ContainerWithHeader>
      </SlideModal>
    );
  }
}

export default withTheme(SelectorOptions);
