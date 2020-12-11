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

import React from 'react';
import { Image } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { Theme } from 'models/Theme';
import { BaseText, MediumText } from 'components/Typography';
import { fontStyles, fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';
import t from 'translations/translate';
import Button from 'components/Button';

type Props = {
  theme: Theme,
  onButtonPress: () => void,
  backgroundColor: string,
};

const Wrapper = styled.ScrollView`
  padding: 0 20px;
  flex: 1;
  ${({ backgroundColor }) => `background-color: ${backgroundColor}`};
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.secondaryText};
`;

const Title = styled(MediumText)`
  ${fontStyles.big};
  margin-vertical: 20px;
`;

const SmallText = styled(BaseText)`
${fontStyles.regular};
color: ${themedColors.secondaryText};
`;

const SmallTitle = styled(BaseText)`
  font-size: ${fontSizes.regular};
  margin-bottom: 5;
  line-height: ${fontSizes.regular};
`;

const InnerBox = styled.View`
  background-color: ${({ theme }) => theme.colors.basic050};
  margin-vertical: 24px;
  padding: 20px 49px 16px 30px;
  border-radius: 30px;
`;

const Row = styled.View`
  flex-direction: row;
  margin-bottom: 12px;
`;

const InfoWrapper = styled.View`
  margin-left: 8px;
`;

const BottomContainer = styled.View`
  margin-top: 32px;
  padding: 20px 30px 32px;
  border-radius: 30px;
  background-color: ${({ theme }) => theme.colors.basic050};
  align-items: center;
`;

const ImgWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const image = require('assets/images/exchangeProviders/wbtcBanner.png');
const iconOne = require('assets/icons/icon_orange_one.png');
const iconTwo = require('assets/icons/icon_orange_two.png');
const iconThree = require('assets/icons/icon_orange_three.png');

const WBTCCafeIntro = ({ onButtonPress, backgroundColor }: Props) => {
  const getInnerBoxItem = (title: string, text: string, icon: number) => (
    <Row>
      <Image source={icon} style={{ height: 16, width: 16 }} />
      <InfoWrapper>
        <SmallTitle>{title}</SmallTitle>
        <SmallText>{text}</SmallText>
      </InfoWrapper>
    </Row>
  );

  const getInnerBox = () => (
    <InnerBox>
      {getInnerBoxItem(t('wbtcCafe.ren'), t('wbtcCafe.renInfo'), iconOne)}
      {getInnerBoxItem(t('wbtcCafe.curve'), t('wbtcCafe.curveInfo'), iconTwo)}
      {getInnerBoxItem(t('wbtcCafe.wbtc'), t('wbtcCafe.wbtcInfo'), iconThree)}
    </InnerBox>
  );

  return (
    <Wrapper contentContainerStyle={{ paddingBottom: 50, paddingTop: 16 }} backgroundColor={backgroundColor}>
      <ImgWrapper>
        <Image source={image} style={{ marginBottom: 25 }} resizeMode="contain" />
      </ImgWrapper>
      <Text>{t('wbtcCafe.intro')}</Text>
      <Title>{t('wbtcCafe.how')}</Title>
      <Text>{t('wbtcCafe.info')}</Text>
      {getInnerBox()}
      <BottomContainer>
        <Title>{t('wbtcCafe.put')}</Title>
        <Button title={t('wbtcCafe.get')} onPress={onButtonPress} />
      </BottomContainer>
    </Wrapper>
  );
};

export default withTheme(WBTCCafeIntro);
