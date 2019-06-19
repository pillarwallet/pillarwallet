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
import styled from 'styled-components/native';
import { TouchableWithoutFeedback, View } from 'react-native';
import { Shadow } from 'components/Shadow';
import { baseColors } from 'utils/variables';

const CardOutter = styled.View`
  position: relative;
`;

const ContentWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 6px;
  background: ${baseColors.white};
  width: 100%;
`;

type Props = {
  children: React.Node,
  wrapperStyle?: Object,
  contentWrapperStyle?: Object,
  onPress?: Function,
}

type State = {
  cardHeight: ?number,
  cardWidth: ?number,
}

const SHADOW_LENGTH = 3;

export default class ShadowedCard extends React.PureComponent<Props, State> {
  state = {
    cardHeight: null,
    cardWidth: null,
  };

  render() {
    const {
      wrapperStyle,
      contentWrapperStyle,
      children,
      onPress,
    } = this.props;
    const { cardHeight, cardWidth } = this.state;
    return (
      <CardOutter style={wrapperStyle}>
        {!!(cardHeight && cardWidth) &&
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
            opacity: 0.8,
          }}
          shadowRadius={4}
        />}
        <TouchableWithoutFeedback onPress={onPress}>
          <ContentWrapper>
            <View
              style={contentWrapperStyle}
              onLayout={(e) => {
                this.setState({
                  cardHeight: e.nativeEvent.layout.height + SHADOW_LENGTH,
                  cardWidth: e.nativeEvent.layout.width + SHADOW_LENGTH,
                });
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
