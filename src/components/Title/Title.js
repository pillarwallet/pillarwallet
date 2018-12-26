// @flow
import * as React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { BoldText } from 'components/Typography';


type Props = {
  title?: string,
  style?: Object,
  noMargin?: boolean,
  align?: string,
  fullWidth?: boolean,
  subtitle?: boolean,
  maxWidth?: number,
  noBlueDot?: boolean,
  dotColor?: string,
  onTitlePress?: Function,
  titleStyles?: ?Object,
};

const Wrapper = styled.View`
  margin: ${props => props.noMargin ? '0' : '16px 0'};
  align-self: ${props => props.align ? props.align : 'flex-start'};
  position: relative;
  top: 2px;
  ${({ maxWidth }) => maxWidth && `
    width: maxWidth;
  `};
  ${({ fullWidth }) => fullWidth ? 'width: 100%;' : ''}
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.large};
  font-size: ${props => props.subtitle ? fontSizes.medium : fontSizes.large};
  font-weight: ${fontWeights.bold};
  ${({ align }) => align === 'center' && `
    width: 100%;
    text-align: center;
  `}
  ${({ fullWidth }) => !fullWidth ? 'max-width: 230px;' : 'width: 100%;'}
`;

const BlueDot = styled(BoldText)`
  color: ${baseColors.brightSkyBlue};
  font-size: ${Platform.OS === 'ios' ? 30 : 26}px;
`;


const Title = (props: Props) => {
  const ellipsized = !props.fullWidth ? {
    ellipsizeMode: 'middle',
    numberOfLines: 1,
  } : {};

  return (
    <Wrapper
      noMargin={props.noMargin}
      style={props.style}
      align={props.align}
      maxWidth={props.maxWidth}
      fullWidth={props.fullWidth}
    >
      {props.onTitlePress ?
        <TouchableOpacity onPress={props.onTitlePress}>
          <Text
            fullWidth={props.fullWidth}
            align={props.align}
            subtitle={props.subtitle}
            {...ellipsized}
            style={props.titleStyles}
          >
            {props.title}
            {!props.subtitle && !props.noBlueDot && <BlueDot dotColor={props.dotColor}>.</BlueDot>}
          </Text>
        </TouchableOpacity>
        :
        <Text
          fullWidth={props.fullWidth}
          align={props.align}
          subtitle={props.subtitle}
          {...ellipsized}
          style={props.titleStyles}
        >
          {props.title}
          {!props.subtitle && !props.noBlueDot && <BlueDot dotColor={props.dotColor}>.</BlueDot>}
        </Text>
      }
    </Wrapper>
  );
};

export default Title;
