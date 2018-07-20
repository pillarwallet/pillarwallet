// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BaseText } from 'components/Typography';

type Props = {
  children?: React.Node,
  style?: Object,
  gray: boolean,
}

const NotificationCircleOuter = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: ${props => props.gray ? baseColors.mediumGray : baseColors.sunYellow};
  align-items: center;
  justify-content: center;
`;

const NotificationCircleText = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall};
  color: ${props => props.gray ? baseColors.white : baseColors.black};
`;

const NotificationCircle = (props: Props) => {
  return (
    <NotificationCircleOuter style={props.style} gray={props.gray}>
      <NotificationCircleText gray={props.gray}>
        {props.children}
      </NotificationCircleText>
    </NotificationCircleOuter>
  );
};

export default NotificationCircle;
