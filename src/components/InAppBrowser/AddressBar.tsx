import React, { FC, forwardRef } from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';

// Utils
import { fontSizes, spacing, borderRadiusSizes } from 'utils/variables';

// Local
import AddressBarButton from './AddressBarButton';

interface IAddressBar {
  colors?: any;
  isDarkTheme?: boolean;
  url: string;
  urlValue: string;
  onUrlChange: (text: string | null) => void;
  isTyping: boolean;
  goToUrl: () => void;
  onBlur: () => void;
  isLoading: boolean;
  refreshUrl: () => void;
  stopLoading: () => void;
  openOptionsMenu: () => void;
}

const AddressBar = forwardRef<TextInput, IAddressBar>((props, ref) => {
  const {
    colors,
    isDarkTheme,
    url,
    urlValue,
    onUrlChange,
    isTyping,
    goToUrl,
    onBlur,
    isLoading,
    refreshUrl,
    stopLoading,
    openOptionsMenu,
  } = props;

  return (
    <AddressBarContainer>
      <AddressBarButton
        icon={'pillar-browser' + (isDarkTheme ? '-dark' : '')}
        onPress={openOptionsMenu}
        color={isDarkTheme ? colors.basic090 : colors.basic020}
      />
      <InputContainer>
        <UrlInput
          ref={ref}
          value={urlValue ?? url}
          onChangeText={onUrlChange}
          onSubmitEditing={goToUrl}
          onBlur={onBlur}
          autoCapitalize={'none'}
          autoComplete={'off'}
          selectTextOnFocus={true}
          textContentType={'URL'}
          keyboardType={'url'}
        />
      </InputContainer>
      {isLoading ? (
        <AddressBarButton icon={'close'} onPress={stopLoading} />
      ) : isTyping ? (
        <AddressBarButton icon={'arrow-right'} onPress={goToUrl} />
      ) : (
        <AddressBarButton icon={'refresh'} onPress={refreshUrl} />
      )}
    </AddressBarContainer>
  );
});

const AddressBarContainer = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  height: 48px;
  background-color: ${({ theme }) => theme.colors.basic060}
  margin-horizontal: ${spacing.mediumLarge}
  margin-vertical: ${spacing.small}
  border-radius: ${borderRadiusSizes.small}
`;

const InputContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const UrlInput = styled.TextInput`
  font-size: ${fontSizes.rRegular}px;
  color: ${({ theme }) => theme.colors.basic030};
`;

export default AddressBar;
