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

import React from 'react';
import { Dimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import IconWithBackgroundGif from 'components/Gif/IconWithBackgroundGif';
import { Spacing } from 'components/legacy/Layout';
import { MediumText } from 'components/legacy/Typography';

// Utils
import { spacing } from 'utils/variables';

// Hooks
import { useBioMetricsPopup } from 'hooks/biometrics';

const { height } = Dimensions.get('window');

function GetNotifincations() {
  const { t } = useTranslationWithPrefix('biometricLogin');
  const navigation = useNavigation();

  useBioMetricsPopup(navigation);

  return (
    <ContainerWithHeader headerProps={{ noBack: true }}>
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <IconWithBackgroundGif iconName="face-id" />
        <Spacing h={height * 0.05} />
        <MediumText fontSize={24} style={{ textAlign: 'center' }}>
          {t('enableBiometric')}
        </MediumText>
      </ContentWrapper>
    </ContainerWithHeader>
  );
}

export default GetNotifincations;

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;
