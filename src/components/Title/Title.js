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
  top: 0px;
  ${({ maxWidth }) => maxWidth && `
    width: maxWidth;
  `}
  ${({ fullWidth }) => fullWidth ? 'width: 100%;' : ''}
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.extraLarger};
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

  const {
    noMargin,
    style,
    align,
    maxWidth,
    fullWidth,
    subtitle,
    onTitlePress,
    titleStyles,
    title,
    noBlueDot,
    dotColor,
  } = props;

  const noBlueDotNeeded = noBlueDot || !title;

  return (
    <Wrapper
      noMargin={noMargin}
      style={style}
      align={align}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      {onTitlePress ?
        <TouchableOpacity onPress={onTitlePress}>
          <Text
            align={align}
            subtitle={subtitle}
            {...ellipsized}
            style={titleStyles}
            fullWidth={fullWidth}
          >
            {title}
            {!subtitle && !noBlueDotNeeded && <BlueDot dotColor={dotColor}>.</BlueDot>}
          </Text>
        </TouchableOpacity>
        :
        <Text
          align={align}
          subtitle={subtitle}
          {...ellipsized}
          style={titleStyles}
          fullWidth={fullWidth}
        >
          {title}
          {!subtitle && !noBlueDotNeeded && <BlueDot dotColor={dotColor}>.</BlueDot>}
        </Text>
      }
    </Wrapper>
  );
};

export default Title;
