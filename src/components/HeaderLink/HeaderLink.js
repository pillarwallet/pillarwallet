// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { TextLink } from 'components/Typography';
import { baseColors } from 'utils/variables';

type Props = {
  children: React.Node,
  onPress?: Function,
  disabled?: boolean,
  isLoading?: boolean,
}

const ActivityIndicator = styled.ActivityIndicator`
  margin-right: 16px;
`;

const HeaderLink = (props: Props) => {
  return (
    props.isLoading ?
      <ActivityIndicator animating color={baseColors.electricBlue} /> :
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
