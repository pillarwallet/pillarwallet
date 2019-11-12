// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, Animated, SafeAreaView } from 'react-native';
import styled from 'styled-components/native';
import { Svg, Path } from 'react-native-svg';
import SVGPath from 'art/modes/svg/path';
import Button from 'components/Button';
import { Paragraph } from 'components/Typography';
import { baseColors, spacing } from 'utils/variables';

const { width, height } = Dimensions.get('window');
const radius = 60;
const xc = (width * 3) / 2;
const yc = (height * 3) / 2;
const overlay = SVGPath()
  .moveTo(0, 0)
  .lineTo(width * 3, 0)
  .lineTo(width * 3, height * 3)
  .lineTo(0, height * 3)
  .lineTo(0, 0)
  .close()

  .moveTo(xc - radius, yc)
  .counterArcTo(xc, yc + radius, radius)
  .counterArcTo(xc + radius, yc, radius)
  .counterArcTo(xc, yc - radius, radius)
  .counterArcTo(xc - radius, yc, radius);

type Step = {
  x: number;
  y: number;
  label: string;
}

type Props = {
  steps: Step[];
}

type State = {
  index: number
}


const Container = styled.View`
  position: absolute;
  top: -${height}px;
  left: -${width}px;
  width: ${width * 3}px;
  height: ${height * 3}px;
`;

const Content = styled.View`
  ${StyleSheet.absoluteFillObject};
  justify-content: flex-end;
  padding: ${spacing.large}px;
`;

const WhiteParagraph = styled(Paragraph)`
  color: ${baseColors.white};
`;


const ContainerAnimated = Animated.createAnimatedComponent(Container);

export default class Walkthrough extends React.PureComponent<Props, State> {
  x = new Animated.Value(0);

  y = new Animated.Value(0);

  state = {
    index: -1,
  };

  componentDidMount() {
    this.nextStep();
  }

  nextStep = () => {
    const { x, y } = this;
    const { steps } = this.props;
    const { index } = this.state;
    if (index + 1 >= steps.length) {
      this.setState({ index: -1 });
    } else {
      this.setState({ index: index + 1 });
      const step = steps[index + 1];
      Animated.parallel([
        Animated.timing(x, {
          toValue: step.x,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: step.y,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  render() {
    const { x, y } = this;
    const { steps } = this.props;
    const { index } = this.state;
    const step = steps[index];
    const translateX = Animated.add(x, new Animated.Value((-width / 2) + radius));
    const translateY = Animated.add(y, new Animated.Value((-height / 2) + radius));
    if (index === -1) {
      return null;
    }
    return (
      <React.Fragment>
        <ContainerAnimated
          style={{
            transform: [
              { translateX },
              { translateY },
            ],
          }}
        >
          <Svg style={StyleSheet.absoluteFill}>
            <Path
              d={overlay.toSVG()}
              fill={baseColors.slateBlack}
              opacity={0.85}
            />
          </Svg>
        </ContainerAnimated>
        <Content>
          <SafeAreaView>
            <WhiteParagraph small>{step.label}</WhiteParagraph>
            <Button title="Next" onPress={this.nextStep} />
          </SafeAreaView>
        </Content>
      </React.Fragment>
    );
  }
}
