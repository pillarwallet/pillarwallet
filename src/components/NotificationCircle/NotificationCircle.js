// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  children?: React.Node,
  style?: Object,
}

const NotificationCircleOuter = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: ${baseColors.sunYellow};
  align-items: center;
  justify-content: center;
`;

const NotificationCircleText = styled.Text`
  font-size: ${fontSizes.extraExtraSmall};
`;

const NotificationCircle = (props: Props) => {
  return (
    <NotificationCircleOuter style={props.style}>
      <NotificationCircleText>
        {props.children}
      </NotificationCircleText>
    </NotificationCircleOuter>
  );
};

export default NotificationCircle;
