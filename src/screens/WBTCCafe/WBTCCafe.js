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
import { connect } from 'react-redux';
import { LayoutAnimation } from 'react-native';
import { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import { hasSeenWbtcCafeIntroAction } from 'actions/appSettingsActions';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import type { Theme } from 'models/Theme';
import { baseColors } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import { images } from 'utils/images';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

import WBTCCafeIntro from './WBTCCafeIntro';

interface Props {
  navigation: NavigationScreenProp;
  hasSeenWbtcCafeIntro: boolean;
  updateHasSeenIntro: () => void;
  theme: Theme;
}

interface State {
  showIntro: boolean;
}

const getBackgroundColor = (theme: Theme) =>
  theme.current === LIGHT_THEME ? baseColors.snowWhite : themedColors.iconBackground;

class WBTCCafe extends React.Component<Props, State> {
  state: State = { showIntro: !this.props.hasSeenWbtcCafeIntro };

  handleButtonPress = () => {
    const { updateHasSeenIntro, hasSeenWbtcCafeIntro } = this.props;
    if (!hasSeenWbtcCafeIntro) updateHasSeenIntro();
    this.toggleIntro();
  };

  toggleIntro = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({ showIntro: !this.state.showIntro });
  }

  render() {
    const { theme } = this.props;
    const { showIntro } = this.state;
    const backgroundColor = getBackgroundColor(theme);
    const { infoIcon } = images(theme);
    return (
      <ContainerWithHeader headerProps={{
        noBottomBorder: true,
        centerItems: [{ title: t('wbtcCafe.cafe') }],
        wrapperStyle: { backgroundColor },
        rightItems: [!showIntro && { iconSource: infoIcon, onPress: this.toggleIntro }],
      }}
      >
        {showIntro && <WBTCCafeIntro onButtonPress={this.handleButtonPress} backgroundColor={backgroundColor} />}
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateHasSeenIntro: () => dispatch(hasSeenWbtcCafeIntroAction()),
});

const mapStateToProps = ({
  appSettings: { data: { hasSeenWbtcCafeIntro } },
}: RootReducerState): $Shape<Props> => ({
  hasSeenWbtcCafeIntro,
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(WBTCCafe));

