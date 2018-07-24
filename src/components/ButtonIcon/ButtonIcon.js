// @flow
import * as React from 'react';
import { StyleSheet, Platform, TouchableNativeFeedback, View } from 'react-native';
import { Button } from 'native-base';
import Icon from 'components/Icon';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
  iconStyle?: StyleSheet.Styles,
  type?: string,
  margin?: number,
}

const ButtonIcon = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
    margin,
    type = 'Ionicons',
  } = props;
  const iconParams = {
    active: false,
    name: icon,
    style: {
      paddingTop: 0,
      fontSize,
      color,
      marginLeft: margin,
      marginRight: margin,
      marginTop: margin,
      marginBottom: margin,
    },
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
