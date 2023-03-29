/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import styled from 'styled-components/native';

// Components
import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

// Utils
import { spacing, fontStyles, borderRadiusSizes } from 'utils/variables';

type Props = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  text?: string;
  lightText?: boolean;
  small?: boolean;
  paddingVertical?: number;
  paddingHorizontal?: number;
  highlightBackground?: boolean;
  roundedBorders?: boolean;
  style?: ViewStyleProp;
};

const CheckBoxWithText = ({
  value,
  onValueChange,
  disabled,
  text,
  lightText,
  small,
  paddingHorizontal,
  paddingVertical,
  highlightBackground,
  roundedBorders,
  style,
}: Props) => {
  const handlePress = () => {
    if (disabled) return;

    onValueChange?.(!value);
  };

  return (
    <CheckBoxWrapper
      style={style}
      active={value}
      roundedBorders={roundedBorders}
      highlightBackground={highlightBackground}
    >
      <CheckBoxTouchable
        onPress={handlePress}
        disabled={disabled || !onValueChange}
        paddingHorizontal={paddingHorizontal}
        paddingVertical={paddingVertical}
      >
        <Field disabled={disabled} text={text} testID="checkBox">
          {!!value && <CheckMark />}
        </Field>
        {!!text && (
          <CheckBoxText small={small} lightText={lightText}>
            {text}
          </CheckBoxText>
        )}
      </CheckBoxTouchable>
    </CheckBoxWrapper>
  );
};

export default CheckBoxWithText;

const CheckBoxWrapper = styled.View`
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  border-radius: ${({ roundedBorders }) => (roundedBorders ? borderRadiusSizes.defaultButton : 2)}px;
  ${({ active, highlightBackground, theme }) =>
    active && highlightBackground && `background-color: ${theme.colors.basic060};`}
`;

const CheckBoxTouchable = styled.TouchableOpacity`
  flex-direction: row;
  padding: ${({ paddingVertical }) => paddingVertical || 0}px ${({ paddingHorizontal }) => paddingHorizontal ?? 0}px;
`;

const Field = styled.View`
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin: 2px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.checkBoxField};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  ${({ text }) => text && `margin-right: ${spacing.large}px;`}
`;

const CheckMark = styled(Icon).attrs({ name: 'check' })`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.checkMark};
`;

const CheckBoxText = styled(BaseText)`
  ${(props) => (props.small ? fontStyles.regular : fontStyles.medium)};
  color: ${({ light, theme }) => (light ? theme.colors.basic020 : theme.colors.basic000)};
  flex-wrap: wrap;
`;
