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
import Clipboard from '@react-native-community/clipboard';
import t from 'translations/translate';

// Components
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import FloatingButtons from 'components/FloatingButtons';
import Icon from 'components/Icon';
import IconSvg from 'components/IconSvg';
import Image from 'components/Image';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ProfileImage from 'components/ProfileImage';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { images } from 'utils/images';
import { getMatchingSortedData } from 'utils/textInput';
import { isValidAddress } from 'utils/validators';

// Types
import type { Theme } from 'models/Theme';
import type { HorizontalOption, Option } from 'models/Selector';
import type { SlideModalInstance } from 'components/Modals/SlideModal';

type OwnProps = {|
  horizontalOptionsData?: HorizontalOption[],
  showOptionsTitles?: boolean,
  renderOption?: (option: Option, onSelect: (option: Option) => void) => React.Node,
  onOptionSelect?: (option: Option) => mixed,
  optionKeyExtractor?: (item: Object) => string,
  title?: string,
  options?: Option[],
  optionsTitle?: string,
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


const DIAMETER = 64;
const ITEM_SPACING = 13;

const OptionsHeader = styled(MediumText)`
  margin: ${spacing.large}px ${spacing.layoutSides}px 0;
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;

const HorizontalOptions = styled.View`
  margin-bottom: ${spacing.small}px;
  background-color: ${({ theme }) => theme.colors.basic070};
`;

const HorizontalOptionItem = styled.TouchableOpacity`
  align-items: center;
  width: ${DIAMETER + (ITEM_SPACING * 2)}px;
  padding-top: ${spacing.medium}px;
`;

const HorizontalOptionItemName = styled(BaseText)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.basic010};
  padding: 0 4px;
  margin-top: 8px;
`;

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

const IconCircle = styled.View`
  width: ${DIAMETER}px;
  height: ${DIAMETER}px;
  border-radius: ${DIAMETER / 2}px;
  background-color: ${({ theme }) => theme.colors.basic020};
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
`;

const IconImage = styled(Image)`
  height: ${DIAMETER}px;
  width: ${DIAMETER}px;
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

  renderHorizontalOptions = (horizontalOptionsData: HorizontalOption[]) => {
    const { showOptionsTitles } = this.props;
    if (!horizontalOptionsData) return null;

    return horizontalOptionsData.map<React.Node>((optionsInfo: HorizontalOption, index) => {
      const { title, data } = optionsInfo;
      if (!data?.length) return null;
      return (
        <HorizontalOptions key={title || index.toString()}>
          {(showOptionsTitles && !!title) && <OptionsHeader>{title}</OptionsHeader>}
          <FlatList
            data={data}
            keyExtractor={({ value, id }) => value || id || ''}
            keyboardShouldPersistTaps="always"
            renderItem={this.renderHorizontalOption}
            horizontal
            contentContainerStyle={{ paddingHorizontal: 7, paddingVertical: spacing.medium }}
            ItemSeparatorComponent={() => <View style={{ width: 2, height: 1 }} />}
          />
        </HorizontalOptions>
      );
    });
  };

  renderHorizontalOption = ({ item }: { item: Option }) => {
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
      showOptionsTitles,
      optionsTitle,
      horizontalOptionsData = [],
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
    const emptyStateMessage = (allowEnteringCustomAddress && !!query && !isQueryValidAddress)
      ? t('error.invalid.address')
      : t('label.nothingFound');

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
            keyExtractor={this.optionKeyExtractor}
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
