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
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { ThemeProvider } from 'styled-components/native';
import t from 'translations/translate';
import Emoji from 'react-native-emoji';
import { Image, StatusBar } from 'react-native';

// actions
import { upgradeToEtherspotAction } from 'actions/etherspotActions';

// constants
import { DARK_THEME, LIGHT_CONTENT } from 'constants/appSettingsConstants';

// components
import {
  Center,
  Container,
  ScrollWrapper,
  Spacing,
} from 'components/Layout';
import {
  BaseText,
  MediumText,
  Paragraph,
} from 'components/Typography';
import Button from 'components/Button';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { getThemeByType } from 'utils/themes';

// types
import type { Dispatch } from 'reducers/rootReducer';

// assets
const etherspotUpgradeImage = require('assets/images/etherspotUpgrade.png');


type Props = {
  navigation: NavigationScreenProp,
  upgradeToEtherspot: () => void,
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const SubTitle = styled(BaseText)`
  font-size: 20px;
  line-height: 30px;
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const CardContent = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.rhythm}px;
  border-radius: 10px;
  min-height: 68px;
  background-color: ${({ theme }) => theme.colors.basic050};
  margin-bottom: 32px;
`;

const CardTitle = styled(BaseText)`
  ${fontStyles.medium};
`;

const CardEmojiWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 48px;
  width: 48px;
  border-radius: 24px;
  margin-left: ${spacing.rhythm}px;
  background-color: ${({ theme }) => theme.colors.basic060};
`;

const CardEmoji = styled(Emoji)`
  font-size: 32px;
`;

const EtherspotUpgrade = ({ upgradeToEtherspot }: Props) => {
  useEffect(() => {
    StatusBar.setBarStyle(LIGHT_CONTENT);
  }, []);

  const benefitList = [
    { title: t('benefitNumberOne'), emoji: 'money_with_wings' },
    { title: t('benefitNumberTwoLonger'), emoji: 'v' },
    { title: t('benefitNumberThreeLong'), emoji: 'innocent' },
  ];

  // NOTE: this screen is always pure dark (#000) background according to Dmitry
  const containerBackgroundColor = '#000';

  return (
    <ThemeProvider theme={getThemeByType(DARK_THEME)}>
      <Container color={containerBackgroundColor}>
        <ScrollWrapper regularPadding>
          <Spacing h={40} />
          <Title center>{t('etherspotContent.upgradeContent.title.enhanceCryptoExperience')}</Title>
          <Spacing h={spacing.rhythm} />
          <Paragraph small light center>
            {t('etherspotContent.upgradeContent.paragraph.yourAccountIsBeingUpgraded')}
          </Paragraph>
          <Spacing h={spacing.rhythm} />
          <Center>
            <Image
              source={etherspotUpgradeImage}
              resizeMode="contain"
            />
          </Center>
          <Spacing h={58} />
          <SubTitle center>{t('etherspotContent.upgradeContent.title.whatIsUpgrade')}</SubTitle>
          <Paragraph small light center>{t('etherspotContent.upgradeContent.paragraph.whatIsUpgrade')}</Paragraph>
          <Spacing h={48} />
          {benefitList.map(({ title, emoji }) => (
            <CardContent key={emoji}>
              <CardTitle style={{ flex: 1 }}>{title}</CardTitle>
              <CardEmojiWrapper>
                <CardEmoji name={emoji} />
              </CardEmojiWrapper>
            </CardContent>
          ))}
          <Spacing h={20} />
          <Paragraph small light center>{t('etherspotContent.upgradeContent.paragraph.upgrade')}</Paragraph>
          <Spacing h={48} />
          <Button
            title={t('etherspotContent.upgradeContent.button.upgrade')}
            onPress={upgradeToEtherspot}
          />
          <Spacing h={40} />
        </ScrollWrapper>
      </Container>
    </ThemeProvider>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  upgradeToEtherspot: () => dispatch(upgradeToEtherspotAction()),
});

export default connect(null, mapDispatchToProps)(EtherspotUpgrade);
