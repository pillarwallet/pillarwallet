// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { transparentize } from 'polished';
import LinearGradient from 'react-native-linear-gradient';
import { Paragraph, BaseText } from 'components/Typography';
import { baseColors, spacing, fontSizes, UIColors } from 'utils/variables';


type Props = {
  text: string,
  lines?: number,
};

type State = {
  expanded: boolean,
  fullHeight: number,
};

type EventLike = {
  nativeEvent: Object,
};

const DescriptionToggleWrapperColors = [
  transparentize(1, UIColors.defaultBackgroundColor), UIColors.defaultBackgroundColor,
];

const DescriptionToggleWrapperActiveColors = [
  transparentize(1, UIColors.defaultBackgroundColor),
  transparentize(1, UIColors.defaultBackgroundColor),
];

const DescriptionWrapper = styled.View`
  z-index: 10;
`;

const DescriptionToggle = styled.TouchableOpacity``;

const DescriptionToggleText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.electricBlue};
  line-height: ${fontSizes.mediumLarge};
`;

const DescriptionToggleWrapper = styled(LinearGradient)`
  position: absolute;
  bottom: ${props => (props.expanded ? 0 : 25)}px;
  right: 0;
  padding-left: 40px;
`;

const Description = styled(Paragraph)`
  padding-bottom: ${spacing.rhythm}px;
  line-height: ${fontSizes.mediumLarge};
`;

// NOTE: we need this element to get the height of the text
const InvisibleText = styled(Paragraph)`
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
`;

export default class TruncatedText extends React.Component<Props, State> {
  state = {
    expanded: false,
    fullHeight: 0,
  };

  toggleText = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  handleTextLayout = (e: EventLike) => {
    this.setState({ fullHeight: e.nativeEvent.layout.height });
  };

  render() {
    const {
      expanded,
      fullHeight,
    } = this.state;
    const {
      text,
      lines = 1,
    } = this.props;

    const truncatedHeight = lines * fontSizes.mediumLarge;
    let shouldDescriptionToggleShow = false;
    if (fullHeight > truncatedHeight) {
      shouldDescriptionToggleShow = true;
    }
    const numberOfLines = !expanded ? lines : null;

    return (
      <DescriptionWrapper expanded={expanded}>
        <InvisibleText onLayout={this.handleTextLayout}>
          {text}
        </InvisibleText>
        <Description
          small
          light
          numberOfLines={numberOfLines}
        >
          {text}
        </Description>
        <DescriptionToggleWrapper
          colors={
            expanded
              ? DescriptionToggleWrapperActiveColors
              : DescriptionToggleWrapperColors
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0 }}
          expanded={expanded}
        >
          {!!shouldDescriptionToggleShow &&
          <DescriptionToggle onPress={this.toggleText}>
            <DescriptionToggleText>
              {expanded ? 'Less' : 'More'}
            </DescriptionToggleText>
          </DescriptionToggle>}
        </DescriptionToggleWrapper>
      </DescriptionWrapper>
    );
  }
}
