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
  TextInput,
  Keyboard,
  FlatList,
} from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Components
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import FloatingButtons from 'components/FloatingButtons';
import Icon from 'components/Icon';
import IconSvg from 'components/IconSvg';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { getMatchingSortedData } from 'utils/textInput';
import { isValidAddress } from 'utils/validators';

// Types
import type { Theme } from 'models/Theme';
import type { Option } from 'models/Selector';
import type { SlideModalInstance } from 'components/Modals/SlideModal';

type OwnProps = {|
  onOptionSelect?: (option: Option) => mixed,
  title?: string,
  options?: Option[],
  searchPlaceholder?: string,
  noImageFallback?: boolean,
  inputIconName?: string,
  iconProps?: Object,
  onHide?: () => void,
  validator?: (value: string) => ?string,
  allowEnteringCustomAddress?: boolean,
  customOptionButtonLabel?: string,
  customOptionButtonOnPress?: (option: Option, close: () => void) => void | Promise<void>,
  onOpen?: () => void,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

type State = {|
  query: ?string,
  hasSearchError: boolean,
  customAddressAsAnOption: ?Option,
  isQueryValidAddress: boolean,
|};

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SearchBarWrapper = styled.View`
  flex: 1;
  padding-vertical: ${spacing.small}px;
  padding-start: ${spacing.layoutSides}px;
  //padding: ${spacing.mediumLarge}px ${spacing.layoutSides}px 0;
`;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const MIN_QUERY_LENGTH = 2;

class ContactSelectorOptions extends React.Component<Props, State> {
  searchInput: React.ElementRef<typeof TextInput>;
  modalRef = React.createRef<SlideModalInstance>();

  constructor(props: Props) {
    super(props);
    this.state = {
      query: null,
      customAddressAsAnOption: null,
      isQueryValidAddress: false,
      hasSearchError: false,
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
    const { allowEnteringCustomAddress } = this.props;
    this.handleSearch(query);
    if (allowEnteringCustomAddress) this.handleCustomAddress(query);
  };

  handleCustomAddress = (query: string) => {
    const isValid = isValidAddress(query);

    this.setState({
      isQueryValidAddress: isValid,
      customAddressAsAnOption: isValid && query
        ? this.getCustomOption(query)
        : null,
    });
  };

  getCustomOption = (address: string) => {
    let option = {
      value: address,
      name: address,
      ethAddress: address,
    };
    const { customOptionButtonLabel, customOptionButtonOnPress } = this.props;
    if (customOptionButtonLabel && customOptionButtonOnPress) {
      option = {
        ...option,
        buttonActionLabel: customOptionButtonLabel,
        buttonAction: () => customOptionButtonOnPress(option, this.close),
      };
    }

    return option;
  };

  handlePaste = async () => {
    const clipboardValue = await Clipboard.getString();
    this.setState({
      query: clipboardValue?.trim() ?? '',
    });
  };

  renderOption = ({ item: option }: Object) => {
    if (option?.value === 'extendedHeaderItems') {
      return option.component;
    }
    const { noImageFallback } = this.props;

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
      searchPlaceholder,
      iconProps = {},
      allowEnteringCustomAddress,
    } = this.props;
    const {
      query,
      customAddressAsAnOption,
      isQueryValidAddress,
      hasSearchError,
    } = this.state;
    const colors = getThemeColors(theme);
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;

    const filteredOptions = isSearching ? getMatchingSortedData(options, query) : options;

    const showEmptyState = !customAddressAsAnOption && !filteredOptions?.length;
    const emptyStateMessage = (allowEnteringCustomAddress && !!query && !isQueryValidAddress)
      ? t('error.invalid.address')
      : t('label.nothingFound');

    const extendedHeaderItems = {
      value: 'extendedHeaderItems', /* eslint-disable-line i18next/no-literal-string */
      component: (
        <>
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
          <SearchContainer>
            <SearchBarWrapper>
              <SearchBar
                inputProps={{
                  onChange: this.handleInputChange,
                  value: query,
                  autoCapitalize: 'none',
                  validator: this.validateSearch,
                }}
                placeholder={searchPlaceholder}
                inputRef={(ref) => {
                  this.searchInput = ref;
                }}
                noClose
                marginBottom="0"
                iconProps={{ ...iconProps, persistIconOnFocus: true }}
              />
            </SearchBarWrapper>

            <Button onPress={this.handlePaste} title={t('button.paste')} transparent small />
          </SearchContainer>

          <FlatList
            stickyHeaderIndices={[0]}
            data={allFeedListData}
            renderItem={this.renderOption}
            // $FlowFixMe: react-native types
            keyExtractor={(option) => option.value || option.name}
            keyboardShouldPersistTaps="always"
            initialNumToRender={10}
            viewabilityConfig={viewConfig}
            windowSize={10}
            hideModalContentWhileAnimating
          />

          <FloatingButtons
            items={[
              { title: t('button.addContact'), icon: ({ color }) => <IconSvg name="addContact" color={color} /> },
              { title: t('button.inviteFriend'), icon: ({ color }) => <Icon name="plus" color={color} fontSize={24} /> },
            ]}
          />
        </ContainerWithHeader>
      </SlideModal>
    );
  }
}

const ThemedSelectorOptions: React.AbstractComponent<OwnProps, SelectorOptions> = withTheme(ContactSelectorOptions);
export default ThemedSelectorOptions;
