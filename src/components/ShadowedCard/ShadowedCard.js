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
import styled, { withTheme } from 'styled-components/native';
import { TouchableWithoutFeedback, View } from 'react-native';
import { Shadow } from 'components/Shadow';
import { themedColors, getThemeType } from 'utils/themes';
import { DARK_THEME } from 'constants/appSettingsConstants';
import type { Theme } from 'models/Theme';

const CardOutter = styled.View`
  position: relative;
`;

const ContentWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 6px;
  background: ${themedColors.card};
  width: 100%;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

type Props = {
  children: React.Node,
  wrapperStyle?: Object,
  contentWrapperStyle?: Object,
  upperContentWrapperStyle?: Object,
  onPress?: ?Function,
  disabled?: boolean,
  theme: Theme,
}

type State = {
  cardHeight: ?number,
  cardWidth: ?number,
  allowRerenderShadow: boolean,
}

const SHADOW_LENGTH = 3;

class ShadowedCard extends React.PureComponent<Props, State> {
  state = {
    cardHeight: null,
    cardWidth: null,
    allowRerenderShadow: false,
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children) {
      this.allowToRerenderShadow();
    }
  }
  allowToRerenderShadow = () => {
    this.setState({ allowRerenderShadow: true });
  };

  render() {
    const {
      wrapperStyle,
      contentWrapperStyle,
      children,
      onPress,
      disabled,
      upperContentWrapperStyle,
      theme,
    } = this.props;
    const currentTheme = getThemeType(theme);
    const { cardHeight, cardWidth, allowRerenderShadow } = this.state;
    return (
      <CardOutter style={wrapperStyle}>
        {!!(cardHeight && cardWidth) && currentTheme !== DARK_THEME &&
        <Shadow
          heightAndroid={cardHeight}
          heightIOS={cardHeight}
          widthIOS={cardWidth}
          widthAndroid={cardWidth}
          useSVGShadow
          wrapperStyle={{
            position: 'absolute',
            top: -(SHADOW_LENGTH / 2),
            left: -(SHADOW_LENGTH / 2),
            opacity: disabled ? 0.4 : 0.8,
          }}
          shadowRadius={4}
        />}
        <TouchableWithoutFeedback onPress={onPress}>
          <ContentWrapper disabled={disabled} style={upperContentWrapperStyle}>
            <View
              style={contentWrapperStyle}
              onLayout={(e) => {
                if ((!cardHeight && !cardWidth) || allowRerenderShadow) {
                  this.setState({
                    cardHeight: e.nativeEvent.layout.height + SHADOW_LENGTH,
                    cardWidth: e.nativeEvent.layout.width + SHADOW_LENGTH,
                    allowRerenderShadow: false,
                  });
                }
              }}
            >
              {children}
            </View>
          </ContentWrapper>
        </TouchableWithoutFeedback>
      </CardOutter>
    );
  }
}

export default withTheme(ShadowedCard);
