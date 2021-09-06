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

import React, { useRef, useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import t from 'translations/translate';
import styled, { useTheme } from 'styled-components/native';

import type { ParsedCmsDocument } from 'models/CMSData';
import type { ScrollEvent } from 'utils/types/react-native';

import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import Button from 'components/legacy/Button';
import Image from 'components/Image';

import { CMS_DATA_TYPES } from 'constants/cmsConstants';
import { spacing } from 'utils/variables';
import { getDeviceWidth } from 'utils/common';
import { images } from 'utils/images';

import TutorialCMSView, { Title, SubTitle } from './TutorialCMSView';
import TutorialFooter from './TutorialFooter';

type Props = {
  data: ParsedCmsDocument[],
  onButtonPress: (val: (typeof NATIVES | typeof NEWBIES)) => void,
  onFinish: () => void,
}

const DEVICE_WIDTH = getDeviceWidth();
const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

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

const Img = styled(Image)`
  width: ${DEVICE_WIDTH * 0.7}px;
  height: 100px;
`;

export default ({ onButtonPress, data, onFinish }: Props) => {
  const scrollViewRef = useRef(null);
  const [scrollIndex, setScrollIndex] = useState<number>(0);
  const [userHasScrolled, setUserHasScrolled] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    !userHasScrolled && scrollIndex && setUserHasScrolled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollIndex]);

  const scrollToIdx = (idx: number) => scrollViewRef?.current?.scrollTo({ x: idx * DEVICE_WIDTH });

  const handleButtonPress = (val: (typeof NATIVES | typeof NEWBIES)) => {
    onButtonPress(val);
    scrollToIdx(1);
  };

  const handleScroll = (e: ScrollEvent) => {
    const xPosition = e.nativeEvent.contentOffset.x;
    setScrollIndex(Math.floor((xPosition / DEVICE_WIDTH) + 0.5));
  };

  const isLast = () => scrollIndex >= data.length;

  const handleNextPress = () => isLast() ? onFinish() : scrollToIdx(scrollIndex + 1);

  const renderInitialScreen = () => (
    <InitialScreenWrapper>
      <ContentWrapper>
        <Title>{t('tutorialTitle')}</Title>
        <SubTitle>{t('tutorialSubtitle')}</SubTitle>
      </ContentWrapper>
      <Img resizeMode="contain" source={images(theme).pillarLogo} />
      <ContentWrapper>
        <TutorialButton title={t('button.new')} onPress={() => handleButtonPress(NEWBIES)} />
        <TutorialButton
          title={t('button.native')}
          onPress={() => handleButtonPress(NATIVES)}
        />
      </ContentWrapper>
    </InitialScreenWrapper>
  );

  return (
    <ContainerWithHeader headerProps={{ noBack: true, centerItems: [{ title: t('title.welcome') }] }}>
      <ScrollView
        horizontal
        bounces={false}
        pagingEnabled
        style={{ width: '100%', flex: 1 }}
        ref={scrollViewRef}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={userHasScrolled}
        scrollEventThrottle={16}
      >
        {renderInitialScreen()}
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
};
