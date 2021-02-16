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
import { connect } from 'react-redux';
import { ThemeProvider } from 'styled-components/native';
import { AppearanceProvider } from 'react-native-appearance';
import { getThemeByType } from 'utils/themes';
import type { RootReducerState } from 'reducers/rootReducer';
import OriginalStorybook from '../../../storybook';

type Props = {
  themeType: string,
};

const Storybook = (props) => {
  const {
    themeType,
  } = props;
  const theme = getThemeByType(themeType);
  return (
    <AppearanceProvider>
      <ThemeProvider theme={theme}>
        <OriginalStorybook />
      </ThemeProvider>
    </AppearanceProvider>
  );
};

const mapStateToProps = ({
  appSettings: { data: { themeType } },
}: RootReducerState): $Shape<Props> => ({
  themeType,
});

export default connect(mapStateToProps)(Storybook);
