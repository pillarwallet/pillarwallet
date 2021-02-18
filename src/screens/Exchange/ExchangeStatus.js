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
import { Animated } from 'react-native';
import styled from 'styled-components/native';
import { fontStyles } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { themedColors } from 'utils/themes';
import t from 'translations/translate';

import type { ViewProps } from 'utils/types/react-native';


const Status = styled.View`
  flex-direction: row;
  height: 22px;
  justify-content: center;
  align-items: center;
`;

const StatusText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.positive};
  letter-spacing: 0.15px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${themedColors.positive};
  margin-left: 8px;
`;

const AnimatedStatusIcon = Animated.createAnimatedComponent<ViewProps, typeof StatusIcon>(StatusIcon);
const AnimatedStatus = Animated.createAnimatedComponent<ViewProps, typeof Status>(Status);

type State = {
  indicatorFadeValue: Animated.Value,
  statusFadeValue: Animated.Value,
};

type Props = {
  isVisible: boolean,
};

class ExchangeStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      indicatorFadeValue: new Animated.Value(0),
      statusFadeValue: new Animated.Value(props.isVisible ? 1 : 0),
    };
  }

  componentDidMount = () => {
    const { isVisible } = this.props;
    if (isVisible) this.startBlinking();
  };

  startBlinking = () => {
    const { indicatorFadeValue } = this.state;
    Animated.loop(
      Animated.sequence([
        Animated.timing(indicatorFadeValue,
          {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          },
        ),
        Animated.delay(400),
        Animated.timing(indicatorFadeValue,
          {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          },
        ),
      ]),
    ).start();
  };

  componentDidUpdate(prevProps: Props) {
    const { isVisible } = this.props;
    const { statusFadeValue } = this.state;
    const toValue = isVisible && !prevProps.isVisible ? 1 : 0;
    if (isVisible !== prevProps.isVisible) {
      Animated.timing(
        statusFadeValue,
        {
          toValue,
          duration: 500,
          useNativeDriver: true,
        },
      ).start();
      this.startBlinking();
    }
  }

  render() {
    const { indicatorFadeValue, statusFadeValue } = this.state;
    const { isVisible } = this.props;

    if (!isVisible) return null;

    return (
      <AnimatedStatus style={{ opacity: statusFadeValue }}>
        <StatusText>{t('exchangeContent.label.updatedRealTime')}</StatusText>
        <AnimatedStatusIcon style={{ opacity: indicatorFadeValue }} />
      </AnimatedStatus>
    );
  }
}

export default ExchangeStatus;
