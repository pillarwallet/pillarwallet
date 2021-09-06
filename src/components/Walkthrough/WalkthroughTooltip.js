// @flow
import * as React from 'react';
import { Dimensions, Platform } from 'react-native';
import styled from 'styled-components/native';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import t from 'translations/translate';

import Button from 'components/legacy/Button';
import { Paragraph, MediumText } from 'components/legacy/Typography';
import { spacing, fontStyles } from 'utils/variables';
import { getiOSNavbarHeight } from 'utils/common';
import { themedColors } from 'utils/themes';
import { hexToRgba } from 'utils/ui';
import type { Measurements } from 'reducers/walkthroughsReducer';


type Props = {
  buttonText?: string,
  targetMeasurements: Measurements,
  onTooltipButtonPress?: Function,
  isAttached?: boolean,
  body?: string,
  title?: string,
}

const { width, height: h } = Dimensions.get('window');

const height = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : h - getiOSNavbarHeight();

const TooltipTitle = styled(MediumText)`
  color: ${themedColors.control};
  ${fontStyles.regular}px;
`;

const TooltipParagraph = styled(Paragraph)`
  color: ${themedColors.control};
  ${fontStyles.regular}px;
  margin: 0;
`;

const TooltipWrapper = styled.View`
  position: absolute;
  ${({ left }) => left || left === 0 ? `left: ${left}px;` : ''};
  ${({ bottom }) => bottom || bottom === 0 ? `bottom: ${bottom}px;` : ''};
  ${({ right }) => right || right === 0 ? `right: ${right}px;` : ''};
  ${({ top }) => top || top === 0 ? `top: ${top}px;` : ''};
  ${({ maxWidth }) => `max-width: ${maxWidth}px;`}
`;

const TooltipArrowHolder = styled.View`
  position: absolute;
  width: 20px;
  height: 10px;
  ${({ left }) => left || left === 0 ? 'left: 30px;' : ''};
  ${({ bottom }) => bottom || bottom === 0 ? `bottom: ${Platform.OS === 'android' ? 0.2 : 0}px;` : ''};
  ${({ right }) => right || right === 0 ? 'right: 30px;' : ''};
  ${({ top }) => top || top === 0 ? 'top: 0;' : ''};
  overflow: hidden;
`;

const TooltipArrow = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  transform: rotate(45deg);
  background-color: ${({ theme }) => hexToRgba(theme.colors.text, 0.8)};
  ${({ bottom }) => bottom || bottom === 0 ? 'bottom: 7px;' : ''};
  ${({ top }) => top || top === 0 ? 'top: 6px;' : ''};
  left: 4px;
`;
/* eslint-enable i18next/no-literal-string */

const TooltipBalloon = styled.View`
  background-color: ${({ theme }) => hexToRgba(theme.colors.text, 0.8)};
  padding: ${spacing.mediumLarge}px;
  border-radius: 14px;
  width: 100%;
  margin: 10px 0;
`;

export const WalkthroughTooltip = (props: Props) => {
  const {
    buttonText,
    targetMeasurements,
    onTooltipButtonPress,
    isAttached,
    body,
    title,
  } = props;

  const {
    x: stepXPos,
    y: stepYPos,
    h: stepItemHeight,
    posOverwrites = {},
  } = targetMeasurements;

  const { x: xOverwrite, y: yOverwrite } = posOverwrites;

  const adjustedY = Platform.OS === 'ios' ? stepYPos : stepYPos + ExtraDimensions.getStatusBarHeight();
  const positionTop = stepYPos > height / 2;

  const horizontalPos = {};
  const verticalPos = {};
  const positionLeft = stepXPos < width / 2;

  if (isAttached) {
    if (positionLeft) {
      horizontalPos.left = xOverwrite || 0;
      horizontalPos.right = yOverwrite || null;
    } else {
      horizontalPos.left = null;
      horizontalPos.right = 0;
    }
  } else if (positionLeft) {
    horizontalPos.left = stepXPos < spacing.large ? spacing.large : stepXPos;
    horizontalPos.right = null;
  } else {
    const rightPos = width - stepXPos;
    horizontalPos.left = null;
    horizontalPos.right = rightPos < spacing.large ? spacing.large : rightPos;
  }

  if (isAttached) {
    if (positionTop) {
      verticalPos.top = null;
      verticalPos.bottom = stepItemHeight;
    } else {
      verticalPos.top = stepItemHeight;
      verticalPos.bottom = null;
    }
  } else if (positionTop) {
    verticalPos.top = null;
    verticalPos.bottom = height - adjustedY;
  } else {
    verticalPos.top = adjustedY + stepItemHeight;
    verticalPos.bottom = null;
  }

  let sides = 0;
  if (horizontalPos.right) sides += horizontalPos.right;
  if (horizontalPos.left) sides += horizontalPos.left;
  const maxWidth = width - spacing.large - sides;

  return (
    <TooltipWrapper {...horizontalPos} {...verticalPos} maxWidth={maxWidth}>
      <TooltipArrowHolder {...horizontalPos} {...verticalPos}>
        <TooltipArrow {...verticalPos} />
      </TooltipArrowHolder>
      <TooltipBalloon>
        {!!title && <TooltipTitle>{title}</TooltipTitle>}
        {!!body && <TooltipParagraph>{body}</TooltipParagraph>}
        {onTooltipButtonPress && <Button
          title={buttonText || t('button.next')}
          onPress={onTooltipButtonPress}
          small
          style={{ marginTop: spacing.mediumLarge }}
        />}
      </TooltipBalloon>
    </TooltipWrapper>
  );
};

