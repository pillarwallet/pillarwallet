// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { transparentize } from 'polished';
import LinearGradient from 'react-native-linear-gradient';
import { Paragraph, BaseText } from 'components/Typography';
import { baseColors, spacing, fontSizes } from 'utils/variables';


type Props = {
  text: string,
};

type State = {
  expanded: boolean,
};

const AssetDescriptionToggleWrapperColors = [transparentize(1, baseColors.white), baseColors.white];

const AssetDescriptionToggleWrapperActiveColors = [
  transparentize(1, baseColors.white),
  transparentize(1, baseColors.white),
];

const AssetDescriptionWrapper = styled.View`
  height: ${props => (props.expanded ? 'auto' : '24px')};
  z-index: 10;
`;

const AssetDescriptionToggle = styled.TouchableOpacity`
  padding: ${spacing.rhythm / 2}px 0 ${spacing.rhythm / 2}px;
`;

const AssetDescriptionToggleText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.electricBlue};
  line-height: 18px;
`;

const AssetDescriptionToggleWrapper = styled(LinearGradient)`
  position: absolute;
  bottom: ${props => (props.expanded ? '-6px' : '-6px')};
  right: 0;
  padding-left: 40px;
`;

const AssetDescription = styled(Paragraph)`
  padding-bottom: ${spacing.rhythm}px;
`;

export default class TruncatedText extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }

  toggleText = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    const { expanded } = this.state;
    const { text } = this.props;
    const shouldAssetDescriptionToggleShow = text.length > 40;
    return (
      <AssetDescriptionWrapper expanded={expanded}>
        <AssetDescription small light>
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
          {shouldAssetDescriptionToggleShow && (
            <AssetDescriptionToggle onPress={this.toggleText}>
              <AssetDescriptionToggleText>
                {expanded ? 'Less' : 'More'}
              </AssetDescriptionToggleText>
            </AssetDescriptionToggle>
          )}
        </AssetDescriptionToggleWrapper>
      </AssetDescriptionWrapper>
    );
  }
}
