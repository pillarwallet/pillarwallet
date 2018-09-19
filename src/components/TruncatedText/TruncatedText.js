// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { transparentize } from 'polished';
import LinearGradient from 'react-native-linear-gradient';
import { Paragraph, BaseText } from 'components/Typography';
import { baseColors, spacing, fontSizes } from 'utils/variables';


type Props = {
  text: string,
  lines?: number,
};

type State = {
  expanded: boolean,
  fullHeight: number,
};

const AssetDescriptionToggleWrapperColors = [transparentize(1, baseColors.white), baseColors.white];

const AssetDescriptionToggleWrapperActiveColors = [
  transparentize(1, baseColors.white),
  transparentize(1, baseColors.white),
];

const AssetDescriptionWrapper = styled.View`
  z-index: 10;
`;

const AssetDescriptionToggle = styled.TouchableOpacity`
`;

const AssetDescriptionToggleText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.electricBlue};
  line-height: ${fontSizes.mediumLarge};
`;

const AssetDescriptionToggleWrapper = styled(LinearGradient)`
  position: absolute;
  bottom: ${props => (props.expanded ? 0 : 25)}px;
  right: 0;
  padding-left: 40px;
`;

const AssetDescription = styled(Paragraph)`
  padding-bottom: ${spacing.rhythm}px;
  line-height: ${fontSizes.mediumLarge};
`;

const AbsoluteInvisibleTextToGetTheHeight = styled(Paragraph)`
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
`;

export default class TruncatedText extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
      fullHeight: 0,
    };
  }

  toggleText = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  handleTextLayout = (e: any) => {
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
    let shouldAssetDescriptionToggleShow = false;
    if (fullHeight > truncatedHeight) {
      shouldAssetDescriptionToggleShow = true;
    }
    const numberOfLines = !expanded ? lines : null;

    return (
      <AssetDescriptionWrapper
        expanded={expanded}
      >
        <AbsoluteInvisibleTextToGetTheHeight
          onLayout={(e) => this.handleTextLayout(e)}
        >
          {text}
        </AbsoluteInvisibleTextToGetTheHeight>
        <AssetDescription
          small
          light
          numberOfLines={numberOfLines}
        >
          {text}
        </AssetDescription>
        <AssetDescriptionToggleWrapper
          colors={
            expanded
              ? AssetDescriptionToggleWrapperActiveColors
              : AssetDescriptionToggleWrapperColors
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0 }}
          expanded={expanded}
        >
          {!!shouldAssetDescriptionToggleShow &&
          <AssetDescriptionToggle onPress={this.toggleText}>
            <AssetDescriptionToggleText>
              {expanded ? 'Less' : 'More'}
            </AssetDescriptionToggleText>
          </AssetDescriptionToggle>}
        </AssetDescriptionToggleWrapper>
      </AssetDescriptionWrapper>
    );
  }
}
