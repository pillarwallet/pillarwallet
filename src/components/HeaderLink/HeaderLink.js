// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'native-base';
import { TextLink } from 'components/Typography';
import { UIColors } from 'utils/variables';

type Props = {
  children: React.Node,
  onPress?: Function,
  disabled?: boolean,
}


const HeaderLink = (props: Props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={props.disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 45,
      }}
    >
      <TextLink
        style={{
          opacity: props.disabled ? 0.5 : 1,
        }}
      >
        {props.children}
      </TextLink>
      <Icon
        name="arrow-forward"
        style={{
          fontSize: 34,
          color: UIColors.primary,
          marginRight: 10,
          opacity: props.disabled ? 0.5 : 1,
        }}
      />

    </TouchableOpacity>
  );
};

export default HeaderLink;
