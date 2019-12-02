// @flow
import React from 'react';
import { Linking } from 'react-native';
import { appFont, baseColors, UIColors } from 'utils/variables';
import ParsedText from 'react-native-parsed-text';
import { handleUrlPress } from 'utils/common';


type Props = {
  text: string,
}

export const CustomParsedText = (props: Props) => {
  const onPhonePress = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const onEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const linkStyle = { color: baseColors.clearBlue };

  return (
    <ParsedText
      style={{
        fontFamily: appFont.regular,
        includeFontPadding: false,
        textAlignVertical: 'center',
        color: UIColors.defaultTextColor,
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

