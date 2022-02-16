import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import Text from 'components/core/Text';
import Icon, { IconName } from 'components/core/Icon';
import { Spacing } from 'components/layout/Layout';

// Utils
import { spacing, borderRadiusSizes } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

interface IWarningBlock {
  text: string;
  arrowDown?: boolean;
  left?: number;
  right?: number;
  backgroundColor?: string;
  textColor?: string;
  icon?: IconName;
  iconColor?: string;
}

const WarningBlock: FC<IWarningBlock> = ({
  text,
  arrowDown = false,
  left,
  right,
  backgroundColor,
  textColor,
  icon,
  iconColor,
}) => {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    textWrapper: {
      flex: 1,
      flexWrap: 'wrap',
      color: textColor ?? colors.secondaryAccent,
    },
    icon: {
      paddingTop: spacing.extraSmall,
    },
  });

  return (
    <HighGasFeeWarning backgroundColor={backgroundColor}>
      <TrianglePointer color={backgroundColor} down={arrowDown} left={left} right={right} />
      <TextRow>
        <Icon name={icon} color={iconColor} style={{ paddingTop: spacing.extraSmall }} />
        <Spacing w={spacing.small} />
        <Text style={styles.textWrapper}>{text}</Text>
      </TextRow>
    </HighGasFeeWarning>
  );
};

export default WarningBlock;

const TextRow = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: flex-start;
`;

const HighGasFeeWarning = styled.View`
  width: 100%;
  margin-top: 10px;
  padding: ${spacing.medium}px;
  ${({ backgroundColor }) => `background-color: ${backgroundColor};`}
  border-radius: ${borderRadiusSizes.small}px;
  flex-direction: row;
`;

const TrianglePointer = styled.View`
  position: absolute;
  width: 10px;
  height: 10px;
  border-left-width: 5px;
  border-left-color: transparent;
  border-right-width: 5px;
  border-right-color: transparent;
  ${({ color, down }) => `border-${down ? 'top' : 'bottom'}-color: ${color};`}
  ${({ down }) =>
    down
      ? `
        bottom: -10px;
        border-top-width: 10px;
      `
      : `
      top: -10px;
      border-bottom-width: 10px;
    `}
  ${({ right, left }) =>
    left ? `left: ${left + borderRadiusSizes.small}px;` : `right: ${(right || 0) + borderRadiusSizes.small}px;`}
`;
