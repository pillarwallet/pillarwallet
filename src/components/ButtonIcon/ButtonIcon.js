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
}

const ButtonIcon = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
  } = props;

  if (Platform.OS === 'ios') {
    return (
      <Button transparent iconLeft={0} onPress={onPress} style={style}>
        <Icon active={false} name={icon} style={{ fontSize, color }} />
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
        padding: 12,
        alignSelf: 'center',
      }}
      >
        <Icon active={false} name={icon} style={[{ alignSelf: 'center' }, { fontSize, color }]} />
      </View>
    </TouchableNativeFeedback>
  );
};

export default ButtonIcon;
