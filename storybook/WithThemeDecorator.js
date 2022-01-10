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
import * as React from 'react';
import { View } from 'react-native';
import { Provider, connect } from 'react-redux';
import { ThemeProvider } from 'styled-components/native';
import { getThemeByType } from 'utils/themes';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

import { Container } from 'components/legacy/Layout';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import Button from 'components/legacy/Button';
import { setAppThemeAction } from 'actions/appSettingsActions';
import { getEnv } from 'configs/envConfig';
import { store } from '../src/configureStore';

type Props = {
  themeType: string,
  children: React.Node,
  setAppTheme: (themeType: string) => void,
};

const StoryWrapper = ({ themeType, children, setAppTheme }: Props) => {
  const theme = getThemeByType(themeType);
  const { current } = theme;
  const themeToChangeTo = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

  return (
    <View style={{ height: '100%' }}>
      <ThemeProvider theme={theme}>
        <Container style={{ flex: 1 }}>{children}</Container>
      </ThemeProvider>
      {!!getEnv().SHOW_THEME_TOGGLE_IN_STORYBOOK && (
        <Button
          title={`THEME: ${current}`} // eslint-disable-line i18next/no-literal-string
          onPress={() => setAppTheme(themeToChangeTo)}
        />
      )}
    </View>
  );
};

const mapStateToProps = ({
  appSettings: {
    data: { themeType },
  },
}: RootReducerState): $Shape<Props> => ({
  themeType,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setAppTheme: (themeType: string) => dispatch(setAppThemeAction(themeType)),
});

const StoryWrapperWithState = connect(mapStateToProps, mapDispatchToProps)(StoryWrapper);

export default (story: Function) => (
  <Provider store={store}>
    <StoryWrapperWithState>{story()}</StoryWrapperWithState>
  </Provider>
);
