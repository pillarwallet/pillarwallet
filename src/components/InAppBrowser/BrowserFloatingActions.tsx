import React, { FC } from 'react';
import { View } from 'react-native';
import SafeAreaView, { ForceInsetProp } from 'react-native-safe-area-view';
import styled from 'styled-components/native';

// Utils
import { spacing, borderRadiusSizes, shadowColors } from 'utils/variables';

// Local
import BrowserFloatingButton from './BrowserFloatingButton';

interface IBrowserFloatingActions {
  canGoBack?: boolean;
  canGoForward?: boolean;
  goBack: () => void;
  goForward: () => void;
}

const BrowserFloatingActions: FC<IBrowserFloatingActions> = ({ canGoBack, canGoForward, goBack, goForward }) => {
  const forcedInset: ForceInsetProp = { bottom: 'always' };
  return (
    <FloatingActions forceInset={forcedInset}>
      <ActionsContainer>
        <BrowserFloatingButton icon={'chevron-left-large'} onPress={goBack} disabled={!canGoBack} />
        <BrowserFloatingButton icon={'chevron-right-large'} onPress={goForward} disabled={!canGoForward} />
      </ActionsContainer>
    </FloatingActions>
  );
};

const FloatingActions = styled.SafeAreaView`
  position: absolute;
  bottom: 30px;
  align-self: center;
  width: 100%;
`;

const ActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  height: 64px;
  background-color: ${({ theme }) => theme.colors.basic090}
  border-radius: ${borderRadiusSizes.mediumSmall}px;
  margin-horizontal: ${spacing.extraLarge}px;
  shadow-opacity: 0.1;
  shadow-color: ${shadowColors.black};
  shadow-radius: ${borderRadiusSizes.small}px;
  shadow-offset: 0 ${spacing.small}px;
  elevation: 6;
`;

export default BrowserFloatingActions;
