// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import type { NavigationScreenProp } from 'react-navigation';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { appFont, baseColors, fontSizes } from 'utils/variables';

// Constants
import { NI_WARNING, NI_SERVICES } from 'constants/navigationConstants';

// Services
import { nativeIntegrationWarning } from 'services/nativeIntegration';

// Types
import t from 'translations/translate';

type Props = {
  isShowLabel: boolean;
  label?: string;
  navigation: NavigationScreenProp<any>;
  response: any[] | null;
};

function AppsButton({ isShowLabel, label, navigation, response }: Props) {
  if (response === null || response?.[0] === undefined) return null

  const onNativeIntegrationsLaunch = async () => {
    const hideNativeIntegrationWarning = await nativeIntegrationWarning();
    if (hideNativeIntegrationWarning) navigation.navigate(NI_SERVICES);
    else navigation.navigate(NI_WARNING);
  };

  return (
    <ButtonContainer onPress={onNativeIntegrationsLaunch}>
      <Icon name={"apps"} />
      <ItemTitle>{t('home.apps.title')}</ItemTitle>
      {isShowLabel && (
        <TextBackground>
          <InformationText>{label ? label : t('home.apps.new')}</InformationText>
        </TextBackground>
      )}
    </ButtonContainer>
  );
}

export default AppsButton;

const ButtonContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.basic050};
  margin: 16px 20px 36px;
  padding: 36px 29px 36px 30px;
  border-radius: 20px;
  border: 1px;
  border-color: ${({ theme }) => theme.colors.basic080};
`;

const TextBackground = styled.View`
  background-color: ${baseColors.dodgerBlue};
  padding: 5px 10px 5px 10px;
  border-radius: 16px;
`;

const InformationText = styled(Text)`
  font-size: ${fontSizes.tiny}px;
  color: ${baseColors.white};
  font-family: ${appFont.medium};
`;

const ItemTitle = styled(Text)`
  flex: 1;
  margin: 0 0 0 8px;
  font-size: ${fontSizes.medium}px;
  font-family: ${appFont.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;
