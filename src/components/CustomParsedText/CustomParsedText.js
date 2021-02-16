// @flow
import React from 'react';
import { Linking } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import { withTheme } from 'styled-components/native';
import { appFont } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { handleUrlPress } from 'utils/common';
import type { Theme } from 'models/Theme';


type Props = {
  text: string,
  theme: Theme,
}

export const CustomParsedText = (props: Props) => {
  const { theme } = props;
  const colors = getThemeColors(theme);
  const onPhonePress = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const onEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const linkStyle = { color: colors.primary };

  return (
    <ParsedText
      style={{
        fontFamily: appFont.regular,
        includeFontPadding: false,
        textAlignVertical: 'center',
        color: colors.text,
      }}
      parse={[
        { type: 'url', style: linkStyle, onPress: (url) => handleUrlPress(url) },
        { type: 'phone', style: linkStyle, onPress: onPhonePress },
        { type: 'email', style: linkStyle, onPress: onEmailPress },
      ]}
    >
      {props.text}
    </ParsedText>
  );
};

export default withTheme(CustomParsedText);

