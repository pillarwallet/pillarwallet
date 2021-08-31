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
import { TextInput, Keyboard, FlatList } from 'react-native';
import t from 'translations/translate';

import { MediumText } from 'components/Typography';
import SearchBar from 'components/legacy/SearchBar';
import SlideModal from 'components/Modals/SlideModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import { spacing, fontStyles } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { getMatchingSortedData } from 'utils/textInput';

import type { Theme } from 'models/Theme';
import type { Option } from 'models/Selector';
import type { IconProps } from 'components/legacy/SearchBar';
import type { SlideModalInstance } from 'components/Modals/SlideModal';

type OwnProps = {|
  showOptionsTitles?: boolean,
  renderOption?: (option: Option, onSelect: (option: Option) => void) => React.Node,
  onOptionSelect?: (option: Option) => mixed,
  optionKeyExtractor?: (item: Object) => string,
  title?: string,
  options?: Option[],
  optionsTitle?: string,
  searchPlaceholder?: string,
  noImageFallback?: boolean,
  iconProps?: IconProps,
  onHide?: () => void,
  onOpen?: () => void,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

type State = {|
  query: ?string,
|};


const OptionsHeader = styled(MediumText)`
  margin: ${spacing.large}px ${spacing.layoutSides}px 0;
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const MIN_QUERY_LENGTH = 2;


class SelectorOptions extends React.Component<Props, State> {
  searchInput: React.ElementRef<typeof TextInput>;
  modalRef = React.createRef<SlideModalInstance>();

  constructor(props: Props) {
    super(props);
    this.state = {
      query: null,
    };
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
    this.handleSearch(query);
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

  close = () => {
    Keyboard.dismiss();
    if (this.modalRef.current) this.modalRef.current.close();
  };

  selectValue = (selectedValue: Option) => {
    this.close();
    const { onOptionSelect } = this.props;
    if (onOptionSelect) onOptionSelect(selectedValue);
  };

  optionKeyExtractor = (option: Option): string => {
    const { optionKeyExtractor } = this.props;
    if (optionKeyExtractor) {
      return optionKeyExtractor(option);
    }
    return option.value;
  };

  handleOptionsOpen = () => {
    const { onOpen } = this.props;
    this.focusInput();
    if (onOpen) onOpen();
  };

  render() {
    const {
      theme,
      title,
      options = [],
      showOptionsTitles,
      optionsTitle,
      searchPlaceholder,
      iconProps = {},
    } = this.props;
    const {
      query,
    } = this.state;
    const colors = getThemeColors(theme);
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;

    const relatedOptions = options || [];

    const filteredOptions = isSearching ? getMatchingSortedData(relatedOptions, query) : relatedOptions;

    const showEmptyState = !filteredOptions?.length;

    const extendedHeaderItems = {
      value: 'extendedHeaderItems', /* eslint-disable-line i18next/no-literal-string */
      component: (
        <>
          {!!showOptionsTitles && !!optionsTitle &&
          <OptionsHeader>{optionsTitle}</OptionsHeader>}
          {showEmptyState &&
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph title={t('label.nothingFound')} />
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
        ref={this.modalRef}
        fullScreen
        onModalShow={this.handleOptionsOpen}
        onModalHide={this.props.onHide}
        noSwipeToDismiss
        noClose
        backgroundColor={colors.basic050}
        noTopPadding
      >
        <ContainerWithHeader
          headerProps={{
            noPaddingTop: true,
            customOnBack: this.close,
            centerItems: [{ title }],
          }}
        >
          <SearchBar
            query={query}
            onChangeQuery={this.handleInputChange}
            placeholder={searchPlaceholder}
            inputRef={(ref) => {
              this.searchInput = ref;
            }}
            // $FlowFixMe
            iconProps={{ ...iconProps, persistIconOnFocus: true }}
          />

          <FlatList
            stickyHeaderIndices={[0]}
            data={allFeedListData}
            renderItem={this.renderOption}
            // $FlowFixMe: react-native types
            keyExtractor={this.optionKeyExtractor}
            keyboardShouldPersistTaps="always"
            initialNumToRender={10}
            viewabilityConfig={viewConfig}
            windowSize={10}
            hideModalContentWhileAnimating
          />
        </ContainerWithHeader>
      </SlideModal>
    );
  }
}

const ThemedSelectorOptions: React.AbstractComponent<OwnProps, SelectorOptions> = withTheme(SelectorOptions);
export default ThemedSelectorOptions;
