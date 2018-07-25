// @flow
import * as React from 'react';
import { View } from 'react-native';
import { baseColors } from 'utils/variables';

const ContactsSeparator = () => {
  return (
    <View style={{ paddingLeft: 58 }}>
      <View style={{ height: 1, width: '100%', backgroundColor: baseColors.lightGray }} />
    </View>
  );
};

export default ContactsSeparator;
