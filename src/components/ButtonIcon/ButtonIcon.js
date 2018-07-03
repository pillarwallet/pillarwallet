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
    type = 'Ionicons',
  } = props;
  const iconParams = {
    active: false,
    name: icon,
    style: { fontSize, color },
    type,
  };
  if (Platform.OS === 'ios') {
    return (
      <Button transparent iconLeft={0} onPress={onPress} style={style}>
        <Icon {...iconParams} />
      </Button>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
    >
      <View style={[{
        padding: 8,
        alignSelf: 'center',
      }, style]}
      >
        <Icon {...iconParams} />
      </View>
    </TouchableNativeFeedback>
  );
};

export default ButtonIcon;
