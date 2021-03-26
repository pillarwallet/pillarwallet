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

import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';

import type { ParsedCMSDocument } from 'models/CMSData';
import type { Theme } from 'models/Theme';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';

import { CMS_DATA_TYPES } from 'constants/cmsConstants';

import { spacing } from 'utils/variables';
import { getDeviceWidth } from 'utils/common';
import TutorialCMSView, { Title, SubTitle } from './TutorialCMSView';
import TutorialFooter from './TutorialFooter';

type Props = {
  data: ParsedCMSDocument[],
  onButtonPress: (val: string) => void,
  theme: Theme,
  onFinish: () => void,
}

const DEVICE_WIDTH = getDeviceWidth();
const { ONBOARDING_SCREENS_FOR_NATIVES, ONBOARDING_SCREENS_FOR_NEWBIES } = CMS_DATA_TYPES;

const InitialScreenWrapper = styled.View`
  height: 100%;
  width: ${DEVICE_WIDTH}px;
  justify-content: space-between;
  padding: ${spacing.rhythm}px;
  align-items: center;
`;

const ContentWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const TutorialButton = styled(Button)`
  margin-bottom: 20px;
  width: 100%;
`;

export default withTheme(({ onButtonPress, data, onFinish }: Props) => {
  const scrollViewRef = useRef(null);
  const [scrollIndex, setScrollIndex] = useState<number>(0);
  const [userHasScrolled, setUserHasScrolled] = useState<boolean>(false);

  const scrollToIdx = (idx: number) =>
    scrollViewRef?.current && scrollViewRef.current.scrollTo({ x: idx * DEVICE_WIDTH });

  const handleButtonPress = (val: string) => {
    onButtonPress(val);
    scrollToIdx(1);
  };

  const handleScroll = (e: Object) => {
    const xPosition = e.nativeEvent.contentOffset.x;
    if (xPosition === 0) {
      setScrollIndex(0);
    } else if (xPosition % DEVICE_WIDTH === 0) {
      setScrollIndex(xPosition / DEVICE_WIDTH);
    }
  };

  const isLast = () => scrollIndex >= data.length;

  const handleNextPress = () => isLast() ? onFinish() : scrollToIdx(scrollIndex + 1);

  return (
    <ContainerWithHeader headerProps={{ noBack: true, centerItems: [{ title: t('title.welcome') }] }}>
      <ScrollView
        horizontal
        bounces={false}
        pagingEnabled
        style={{ width: DEVICE_WIDTH, flex: 1 }}
        ref={scrollViewRef}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={userHasScrolled}
        onMomentumScrollEnd={() => { !userHasScrolled && setUserHasScrolled(true); }}
      >
        <InitialScreenWrapper>
          <ContentWrapper>
            <Title>Welcome to Pillar!</Title>
            <SubTitle>We probably need some cooler content to display here, and perhaps an image</SubTitle>
          </ContentWrapper>
          <ContentWrapper>

            <TutorialButton title={t('button.new')} onPress={() => handleButtonPress(ONBOARDING_SCREENS_FOR_NEWBIES)} />
            <TutorialButton title={t('button.native')} onPress={() => handleButtonPress(ONBOARDING_SCREENS_FOR_NATIVES)} />
          </ContentWrapper>
        </InitialScreenWrapper>
        {data.map(doc => <TutorialCMSView document={doc} key={doc.id} />)}
      </ScrollView>
      <TutorialFooter
        onSkipPress={onFinish}
        isLast={isLast()}
        onBackPress={scrollIndex ? () => scrollToIdx(scrollIndex - 1) : null}
        onNextPress={scrollIndex ? handleNextPress : null}
      />
    </ContainerWithHeader>
  );
});
