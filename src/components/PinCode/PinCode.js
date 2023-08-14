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
import { Animated, Easing } from 'react-native';
import styled from 'styled-components/native';
import { useEffect, useState } from 'react';

// constants
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT } from 'constants/keyPadButtonsConstants';

// components
import KeyPad from 'components/KeyPad';
import { Wrapper } from 'components/legacy/Layout';
import HorizontalDots from 'components/HorizontalDots';
import Spinner from 'components/Spinner';

// selectors
import { useRootSelector } from 'selectors';
import { maxPinCodeLengthSelector } from 'selectors/appSettings';

// Utils
import { useThemeColors } from 'utils/themes';

// types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {
  onPinEntered: Function,
  onPinChanged?: Function,
  onForgotPin?: Function,
  showForgotButton?: boolean,
  pinError?: boolean,
  flex?: boolean,
  customStyle?: ViewStyleProp,
  isLoading?: boolean,
  maxPinCodeLength?: number,
  testIdTag?: string,
};

const PinDotsWrapper = styled(Wrapper)`
  justify-content: center;
  flex-grow: 1;
`;

const Container = styled.View`
  flex-grow: 1;
  justify-content: space-between;
`;

const PinDotsWrapperAnimated = Animated.createAnimatedComponent(PinDotsWrapper);

const errorShakeAnimation = new Animated.Value(0);

const PinCode = ({
  customStyle,
  isLoading,
  pinError,
  onPinChanged,
  onPinEntered,
  onForgotPin,
  showForgotButton = true,
  flex = true,
  maxPinCodeLength: defaultMaxPinCodeLength,
  testIdTag,
}: Props) => {
  const colors = useThemeColors();
  const [pinCode, setPinCode] = useState([]);
  const maxPinCodeLength = defaultMaxPinCodeLength ?? useRootSelector(maxPinCodeLengthSelector);

  useEffect(() => {
    if (!pinError) return;
    Animated.timing(errorShakeAnimation, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [pinError]);

  const handleButtonPressed = (value: string) => {
    if (isLoading) return;

    if (value === KEYPAD_BUTTON_FORGOT) {
      if (onForgotPin) onForgotPin();
      return;
    }

    const newPinCode = value === KEYPAD_BUTTON_DELETE ? pinCode.slice(0, -1) : [...pinCode, value];

    const enteredPinCodeLength = newPinCode.length;

    // pin incomplete
    if (enteredPinCodeLength > maxPinCodeLength) return;

    if (onPinChanged) onPinChanged(newPinCode.join(''));
    setPinCode(newPinCode);

    // is full pin entered
    if (enteredPinCodeLength !== maxPinCodeLength) return;

    const passCodeString = newPinCode.join('');
    if (onPinEntered) onPinEntered(passCodeString);

    setPinCode([]);
  };

  const numActiveDots = pinCode.length;

  return (
    <Container>
      <PinDotsWrapperAnimated
        flex={flex ? 1 : null}
        style={[
          {
            transform: [
              {
                translateX: errorShakeAnimation.interpolate({
                  inputRange: [0, 0.08, 0.25, 0.41, 0.58, 0.75, 0.92, 1],
                  outputRange: ([0, -10, 10, -10, 10, -5, 5, 0]: number[]),
                }),
              },
            ],
          },
          customStyle,
        ]}
      >
        {!!isLoading && <Spinner size={30} />}
        {!isLoading && (
          <HorizontalDots
            pinError={pinError}
            dotStyle={[pinError && { backgroundColor: colors.negative }]}
            wrapperWidth={156}
            wrapperVerticalMargin={20}
            numAllDots={maxPinCodeLength}
            numActiveDots={numActiveDots}
          />
        )}
      </PinDotsWrapperAnimated>
      <KeyPad type="pincode" options={{ showForgotButton }} onKeyPress={handleButtonPressed} testIdTag={testIdTag} />
    </Container>
  );
};

export default PinCode;
