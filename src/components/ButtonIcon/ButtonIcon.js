// @flow
import * as React from 'react';
import { StyleSheet, Platform, TouchableNativeFeedback, View } from 'react-native';
import { Icon, Button } from 'native-base';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
  type?: string,
}

const ButtonIcon = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
    type,
  } = props;
  const CustomIcon = () => {
    if (type) {
      return (
        <Icon active={false} type={type} name={icon} style={{ fontSize, color }} />
      );
    }
    return (
      <Icon active={false} name={icon} style={{ fontSize, color }} />
    );
  };

  if (Platform.OS === 'ios') {
    return (
      <Button transparent iconLeft={0} onPress={onPress} style={style}>
        <CustomIcon />
      </Button>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      style={style}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <View style={{
        padding: 8,
        alignSelf: 'center',

      }}
      >
        <CustomIcon />
      </View>
    </TouchableNativeFeedback>
  );
};

export default ButtonIcon;
