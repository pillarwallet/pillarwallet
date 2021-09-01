// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { Platform, TextInput as RNTextInput, Text as RNText } from 'react-native';

// Components
import TextInput from 'components/inputs/TextInput';
import { appFont, fontSizes } from 'utils/variables';

// Types
import type { TextInputProps, LayoutEvent, FocusEvent, BlurEvent } from 'utils/types/react-native';

export type Props = {|
  ...TextInputProps,
  maxFontSize?: number,
  minFontSize?: number,
|};

type Instance = typeof RNTextInput;

/**
 * TextInput that automatically scales down text to fit on the screen.
 * Scaling down is not applied if font size would get bellow `minFontSize`.
 *
 * Limitations:
 * - padding{Top,Bottom,Left,Right} styles are ignored
 *
 * It uses offscreen `Text` component to measure text to render.
 */
const AutoScaleTextInput = React.forwardRef<Props, Instance>((props, ref) => {
  const { style, maxFontSize = 52, minFontSize: minFontSizeProp, onLayout, onBlur, onFocus, ...rest } = props;

  const minFontSize = minFontSizeProp ?? maxFontSize * 0.5;

  const [width, setWidth] = React.useState();
  const [textLayout, setTextLayout] = React.useState();

  const [targetFontSize, setTargetFontSize] = React.useState(maxFontSize);
  const [targetHeight, setTargetHeight] = React.useState(undefined);
  const [extraPaddingTop, setExtraPaddingTop] = React.useState(0);

  const [isTooLongToFit, setIsTooLongTooFit] = React.useState(false);

  // Scale font size based on width
  React.useLayoutEffect(() => {
    if (width == null || textLayout == null) return;

    const maxWidth = width;

    // Scaling not needed
    if (textLayout.width <= maxWidth || textLayout.width === 0) {
      setTargetFontSize(maxFontSize);
      setTargetHeight(textLayout.height);
      setExtraPaddingTop(0);
      return;
    }

    // Scale down
    const minScale = minFontSize / maxFontSize;
    const caculatedScale = maxWidth / textLayout.width;
    const scale = Math.max(caculatedScale, minScale);
    const newFontSize = Math.floor(scale * maxFontSize);
    setTargetFontSize(newFontSize);
    setIsTooLongTooFit(caculatedScale < minScale);

    const extraSpace = textLayout.height * (1 - scale);
    setTargetHeight(textLayout.height);

    // Magic experimental constant that is preserving baseline on both iOS and Android.
    const baselinePreservingRatio = Platform.OS === 'android' ? 0.62 : 0.56;
    setExtraPaddingTop(baselinePreservingRatio * extraSpace);
  }, [width, textLayout, maxFontSize, minFontSize]);

  const handleLayout = (event: LayoutEvent) => {
    setWidth(event.nativeEvent.layout.width);
    onLayout?.(event);
  };

  const handleTextLayout = (event: LayoutEvent) => {
    setTextLayout(event.nativeEvent.layout);
  };

  // Android Workaround: display front part of number when blurred
  const [isFocussed, setIsFocussed] = React.useState(false);

  const handleFocus = (event: FocusEvent) => {
    setIsFocussed(true);
    onFocus?.(event);
  };

  const handleBlur = (event: BlurEvent) => {
    setIsFocussed(false);
    onBlur?.(event);
  };

  const styleList = [
    styles.baseText,
    style,
    {
      fontSize: targetFontSize,
      height: targetHeight,
      paddingTop: extraPaddingTop,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  ];

  const measureStyle = [
    styles.baseText,
    styles.measureText,
    style,
    { fontSize: maxFontSize, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
  ];

  // Android Workaround: display front part of number when blurred. The downslide is that the press
  // will reset the cursor to front position, so we only apply this if necessary.
  const applyFrontSelection = Platform.OS === 'android' && isTooLongToFit && !isFocussed;

  return (
    <>
      <TextInput
        ref={ref}
        style={styleList}
        {...rest}
        numberOfLines={1}
        onLayout={handleLayout}
        selection={applyFrontSelection ? { start: 0 } : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <RNText style={measureStyle} onLayout={handleTextLayout}>
        {rest.value || '0'}
      </RNText>
    </>
  );
});

export default AutoScaleTextInput;

const styles = {
  baseText: {
    fontFamily: appFont.regular,
    fontSize: fontSizes.regular,
  },
  measureText: {
    flex: 0,
    position: 'absolute',
    top: -10000,
  },
};
