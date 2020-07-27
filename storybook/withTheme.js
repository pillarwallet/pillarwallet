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
import { Provider, connect } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { getThemeByType } from 'utils/themes';
import { I18nextProvider } from 'react-i18next';
import i18n from 'translations/testing';

import type { RootReducerState } from 'reducers/rootReducer';

import configureStore from '../src/configureStore';

const { store } = configureStore();

type Props = {
  themeType: string,
  children: React.Node,
};

const StoryWrapper = ({ themeType, children }: Props) => {
  const theme = getThemeByType(themeType);

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

const mapStateToProps = ({
  appSettings: { data: { themeType } },
}: RootReducerState): $Shape<Props> => ({
  themeType,
});

const StoryWrapperWithState = connect(mapStateToProps)(StoryWrapper);

export default (story: Function) => (
  <Provider store={store}>
    <StoryWrapperWithState>
      <I18nextProvider i18n={i18n}>
        {story()}
      </I18nextProvider>
    </StoryWrapperWithState>
  </Provider>
);
