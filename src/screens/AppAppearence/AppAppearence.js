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
import { useNavigation } from 'react-navigation-hooks';
import t from 'translations/translate';
import styled, { useTheme } from 'styled-components/native';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Button from 'components/core/Button';
import Image from 'components/Image';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

const lightTheme = require('assets/images/appAppearence/lightTheme.png');
const darkTheme = require('assets/images/appAppearence/darkTheme.png');

const AppAppearence = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const colors = getThemeColors(theme);

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content>
        <Title>{t('auth:title.appAppearence')}</Title>
        <Text color={colors.secondaryText} variant="medium" style={{ textAlign: 'center' }}>
          {t('auth:paragraph.appAppearenceDescription')}
        </Text>
        <ThemeView>
          <Themes>
            <ThemeImage source={lightTheme} />
            <Text variant="small" style={{ textAlign: 'center' }}>{t('auth:label.light')}</Text>
          </Themes>
          <Themes style={styles.themeViewStyle}>
            <ThemeImage source={darkTheme} />
            <Text variant="small" style={{ textAlign: 'center' }}>{t('auth:label.dark')}</Text>
          </Themes>
        </ThemeView>
        <Button title={t('auth:button.confirm')} size="large" style={styles.confirmButton} />
      </Content>
    </Container>
  );
};

const styles = {
  confirmButton: {
    marginTop: 91,
  },
  themeViewStyle: {
    marginLeft: spacing.small,
  },
};

const Title = styled(Text)`
  ${fontStyles.large};
  width: 100%;
  height: 48px;
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const ThemeView = styled.View`
  flex-direction: row;
  width: 100%;
  height: 206px;
  margin-top: 48px;
`;

const Themes = styled.View`
  flex: 1;
  width: 164px;
  height: 206px;
  borderColor: ${({ theme }) => theme.colors.negative};
  borderWidth: 2px;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
`;

const ThemeImage = styled(Image)`
  width: 77px;
  height: 125px;
`;

export default AppAppearence;
