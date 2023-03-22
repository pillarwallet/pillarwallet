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

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';
import t from 'translations/translate';
import styled, { useTheme } from 'styled-components/native';

// Components
import { Container, Center } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Button from 'components/core/Button';
import Image from 'components/Image';

// Constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { PIN_CODE_UNLOCK } from 'constants/navigationConstants';

// Utils
import { fontStyles, spacing, appFont } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

// Actions
import { setAppThemeAction } from 'actions/appSettingsActions';
import { saveDbAction } from 'actions/dbActions';
import { logEventAction } from 'actions/analyticsActions';

// Assets
const lightTheme = require('assets/images/appAppearence/lightTheme.png');
const darkTheme = require('assets/images/appAppearence/darkTheme.png');

const AppAppearence = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { current } = theme;
  const colors = getThemeColors(theme);
  const omitPin = navigation.getParam('omitPin');
  const nextScreenPinUnlock = navigation.getParam('next_pin_unlock');

  const [currentTheme] = useState(current);
  const [isLightThemePressed, setLightThemePressed] = useState(current === LIGHT_THEME);
  const [isDarkThemePressed, setDarkThemePressed] = useState(current === DARK_THEME);

  useEffect(() => {
    dispatch(saveDbAction('appearance_visible', true));
  }, [dispatch]);

  const onPressLightTheme = () => {
    setLightThemePressed(true);
    setDarkThemePressed(false);
    dispatch(setAppThemeAction(LIGHT_THEME, true));
  };

  const onPressDarkTheme = () => {
    setDarkThemePressed(true);
    setLightThemePressed(false);
    dispatch(setAppThemeAction(DARK_THEME, true));
  };

  const onConfirm = async () => {
    if (nextScreenPinUnlock) {
      navigation.navigate({
        routeName: PIN_CODE_UNLOCK,
        params: { omitPin },
      });
      dispatch(logEventAction('confirm_app_appearance'));
    } else navigation.goBack(null);
  };

  const onBackPress = () => {
    if (currentTheme === LIGHT_THEME) onPressLightTheme();
    else onPressDarkTheme();
    onConfirm();
  };

  return (
    <Container>
      <HeaderBlock leftItems={[{ close: true }]} onClose={onBackPress} noPaddingTop testIdTag={TAG} />
      <Center flex={1} padding={spacing.rhythm}>
        <Title>{t('auth:title.appAppearence')}</Title>
        <Text color={colors.tertiaryText} variant="medium" style={appearenceStyles.textStyle}>
          {t('auth:paragraph.appAppearenceDescription')}
        </Text>
        <ThemeView>
          <Themes
            onPress={onPressLightTheme}
            style={isLightThemePressed && [selectedThemeStyle, { borderColor: colors.buttonPrimaryBackground }]}
            testID={`${TAG}-button-light_theme`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-light_theme`}
          >
            <ThemeImage source={lightTheme} />
            <Text variant="small" style={appearenceStyles.textStyle}>
              {t('auth:label.light')}
            </Text>
          </Themes>
          <Themes
            onPress={onPressDarkTheme}
            style={isDarkThemePressed && [selectedThemeStyle, { borderColor: colors.buttonPrimaryBackground }]}
            testID={`${TAG}-button-dark_theme`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-dark_theme`}
          >
            <ThemeImage source={darkTheme} />
            <Text variant="small" style={appearenceStyles.textStyle}>
              {t('auth:label.dark')}
            </Text>
          </Themes>
        </ThemeView>
        <Button
          title={t('auth:button.confirm')}
          size="large"
          style={appearenceStyles.confirmButton}
          onPress={onConfirm}
          testID={`${TAG}-button-confirm`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-confirm`}
        />
      </Center>
    </Container>
  );
};

const selectedThemeStyle = {
  borderWidth: 2,
  borderRadius: 10,
};

const appearenceStyles = {
  confirmButton: {
    marginTop: 91,
  },
  textStyle: {
    textAlign: 'center',
  },
};

const Title = styled(Text)`
  ${fontStyles.large};
  width: 100%;
  height: 48px;
  text-align: center;
  margin-bottom: ${spacing.small}px;
  font-family: '${appFont.medium}';
`;

const ThemeView = styled.View`
  flex-direction: row;
  width: 100%;
  height: 206px;
  margin-top: 48px;
`;

const Themes = styled.TouchableOpacity`
  flex: 1;
  width: 164px;
  height: 206px;
  justify-content: center;
  align-items: center;
`;

const ThemeImage = styled(Image)`
  width: 77px;
  height: 125px;
`;

export default AppAppearence;

const TAG = 'AppAppearance';
