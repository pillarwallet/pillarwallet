// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'native-base';
import { TextLink } from 'components/Typography';
import { UIColors } from 'utils/variables';

type Props = {
  children: React.Node,
  onPress?: Function,
}


const HeaderLink = (props: Props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 45,
      }}
    >
      <TextLink>
        {props.children}
      </TextLink>
      <Icon
        name="arrow-forward"
        style={{
          fontSize: 32,
          color: UIColors.primary,
          marginRight: 10,
        }}
      />

    </TouchableOpacity>
  );
};

export default HeaderLink;
