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
import { View, Animated, TouchableOpacity } from 'react-native';

import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { getDeviceWidth, reportLog } from 'utils/common';
import { measure } from 'utils/ui';

// Hook
import useIsMounted from 'hooks/useMounted';

const screenWidth = getDeviceWidth();
const ARROW_SIZE = 10;
const TOOLTIP_WIDTH = 230;
const SIDE_MARGIN = 20;

type Layout = {
  x: number,
  y: number,
  width: number,
  height: number,
};

type Props = {
  body: string,
  positionOnBottom?: boolean,
  isVisible: boolean,
  wrapperStyle?: Object,
  children?: React.Node,
  onPress?: () => void,
};

const Tooltip = (props: Props) => {
  const {
    body,
    children,
    positionOnBottom = true,
    isVisible,
    wrapperStyle,
    onPress,
  } = props;

  const colors = useThemeColors();
  const isMounted = useIsMounted();

  const [wrapperLayout, setWrapperLayout] = React.useState<$ReadOnly<Layout>>({
    width: 0, height: 0, x: 0, y: 0,
  });

  const [tooltipLayout, setTooltipLayout] = React.useState<Layout>({
    x: 0, y: 0, width: 0, height: 0,
  });
  const [wrapperX, setWrapperX] = React.useState(0);
  const [balloonWidth, setBalloonWidth] = React.useState(0);

  const balloonRef = React.useRef<any>(null);

  // for fade-out animation
  const [visibilityState, setVisibilityState] = React.useState<boolean>(false);

  const opacityAnim = React.useRef<Animated.Value>(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (tooltipLayout.height) {
      Animated.timing(opacityAnim, {
        toValue: isVisible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        if (!isVisible && isMounted) setVisibilityState(false);
      });
    }
    if (isVisible && isMounted) {
      setVisibilityState(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, tooltipLayout]);

  const measureBalloonPosition = () => {
    // $FlowFixMe: react-native types
    measure(balloonRef.current)
      .then(({ x }) => setWrapperX(x))
      .catch((error) => {
        reportLog('Can\'t measure tooltip component.', { error });
      });
  };

  React.useEffect(measureBalloonPosition, [isVisible]);

  const onWrapperLayout = ({ nativeEvent: { layout } }) => {
    setWrapperLayout(layout);
    measureBalloonPosition();
  };

  const onTooltipLayout = ({ nativeEvent: { layout } }) => {
    setTooltipLayout(layout);
  };

  const onBalloonLayout = ({ nativeEvent: { layout } }) => {
    setBalloonWidth(layout.width);
  };

  let wrapperPosition = { left: 0 };
  let arrowHolderPosition = { left: 0 };

  if (wrapperLayout.width) {
    wrapperPosition = {
      left: (wrapperLayout.width / 2) - (TOOLTIP_WIDTH / 2),
      right: (wrapperLayout.width / 2) - (TOOLTIP_WIDTH / 2),
      top: positionOnBottom ? wrapperLayout.height : -tooltipLayout.height,
    };
    arrowHolderPosition = {
      left: (TOOLTIP_WIDTH / 2) - ((ARROW_SIZE * Math.sqrt(2)) / 2),
      top: positionOnBottom ? 0 : tooltipLayout.height - ARROW_SIZE,
    };
  }

  let edgeOffset = 0;
  const leftEdge = wrapperX + wrapperPosition.left + ((TOOLTIP_WIDTH - balloonWidth) / 2);
  const rightEdge = leftEdge + balloonWidth;
  if (leftEdge < SIDE_MARGIN) {
    edgeOffset = SIDE_MARGIN - leftEdge;
  } else if (rightEdge > screenWidth - SIDE_MARGIN) {
    edgeOffset = (screenWidth - SIDE_MARGIN) - rightEdge;
  }

  wrapperPosition.left += edgeOffset;
  arrowHolderPosition.left -= edgeOffset;

  const arrowPosition = {
    top: positionOnBottom ? ARROW_SIZE / 2 : -ARROW_SIZE / 2,
  };

  return (
    <View onLayout={onWrapperLayout} style={wrapperStyle} ref={balloonRef}>
      {children}
      {visibilityState && (
        <TooltipWrapper
          onLayout={onTooltipLayout}
          {...wrapperPosition}
          style={{ opacity: opacityAnim }}
        >
          <TouchableOpacity onPress={onPress}>
            <TooltipArrowHolder {...arrowHolderPosition}>
              <TooltipArrow {...arrowPosition} />
            </TooltipArrowHolder>
            <BalloonWrapper>
              <TooltipBalloon onLayout={onBalloonLayout}>
                <Text color={colors.control} variant="small">
                  {body}
                </Text>
              </TooltipBalloon>
            </BalloonWrapper>
          </TouchableOpacity>
        </TooltipWrapper>
      )}
    </View>
  );
};

export default Tooltip;

const TooltipWrapper = styled(Animated.View)`
  width: ${TOOLTIP_WIDTH}px;
  position: absolute;
`;

const TooltipArrowHolder = styled.View`
  position: absolute;
  width: ${ARROW_SIZE * 2}px;
  height: ${ARROW_SIZE}px;
  overflow: hidden;
`;

const TooltipArrow = styled.View`
  width: ${ARROW_SIZE}px;
  height: ${ARROW_SIZE}px;
  border-radius: 2px;
  transform: rotate(45deg);
  background: ${({ theme }) => theme.colors.toastBackgroundColor};
  left: 4px;
`;

const BalloonWrapper = styled.View`
  width: 100%;
  margin: ${ARROW_SIZE}px 0;
  align-items: center;
`;

const TooltipBalloon = styled.View`
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  border-radius: 21px;
  align-items: center;
  background: ${({ theme }) => theme.colors.toastBackgroundColor};
`;
