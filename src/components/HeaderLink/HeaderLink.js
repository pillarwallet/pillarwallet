// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { TextLink } from 'components/Typography';

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
          marginRight: 20,
        }}
      >
        {props.children}
      </TextLink>

    </TouchableOpacity>
  );
};

export default HeaderLink;
