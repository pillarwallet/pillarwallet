import React, { FC, forwardRef } from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';

// Components
import { IconName } from 'components/core/Icon';

// Utils
import { fontSizes, spacing, borderRadiusSizes } from 'utils/variables';

// Local
import AddressBarButton from './AddressBarButton';

interface IButtonActions {
  goToUrl: () => void;
  refreshUrl: () => void;
  stopLoading: () => void;
  openOptionsMenu: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

interface IAddressBar {
  colors?: any;
  isDarkTheme?: boolean;
  url: string;
  urlValue: string;
  onUrlChange: (text: string | null) => void;
  isTyping: boolean;
  onBlur: () => void;
  isLoading: boolean;
  buttonActions: IButtonActions;
}

const AddressBar = forwardRef<TextInput, IAddressBar>((props, ref) => {
  const { colors, isDarkTheme, url, urlValue, onUrlChange, isTyping, onBlur, isLoading, buttonActions } = props;

  const icon: IconName = isDarkTheme ? 'pillar-browser-dark' : 'pillar-browser';

  const LeftButtons: FC = () => {
    return (
      <ButtonsContainer>
        <AddressBarButton
          icon={icon}
          onPress={buttonActions.openOptionsMenu}
          iconColor={isDarkTheme ? colors.basic090 : colors.basic020}
        />
      </ButtonsContainer>
    );
  };

  const RightButtons: FC = () => {
    return (
      <ButtonsContainer>
        {!isTyping && (
          <AddressBarButton
            icon={'chevron-left-large'}
            onPress={buttonActions.goBack}
            disabled={!buttonActions.canGoBack}
          />
        )}

        {!isTyping && (
          <AddressBarButton
            icon={'chevron-right-large'}
            onPress={buttonActions.goForward}
            disabled={!buttonActions.canGoForward}
          />
        )}

        {isLoading ? (
          <AddressBarButton icon={'close'} onPress={buttonActions.stopLoading} />
        ) : isTyping ? (
          <AddressBarButton icon={'arrow-right'} onPress={buttonActions.goToUrl} />
        ) : (
          <AddressBarButton icon={'refresh'} onPress={buttonActions.refreshUrl} />
        )}
      </ButtonsContainer>
    );
  };

  return (
    <AddressBarContainer>
      <LeftButtons />
      <InputContainer>
        <UrlInput
          ref={ref}
          value={urlValue ?? url}
          onChangeText={onUrlChange}
          onSubmitEditing={buttonActions.goToUrl}
          onBlur={onBlur}
          autoCapitalize={'none'}
          autoComplete={'off'}
          selectTextOnFocus={true}
          textContentType={'URL'}
          keyboardType={'url'}
        />
      </InputContainer>
      <RightButtons />
    </AddressBarContainer>
  );
});

const AddressBarContainer = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  height: 48px;
  background-color: ${({ theme }) => theme.colors.basic060};
  margin-horizontal: ${spacing.mediumLarge}px;
  margin-vertical: ${spacing.small}px;
  border-radius: ${borderRadiusSizes.small}px;
`;

const InputContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const UrlInput = styled.TextInput`
  font-size: ${fontSizes.rRegular}px;
  color: ${({ theme }) => theme.colors.basic030};
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
`;

export default AddressBar;
