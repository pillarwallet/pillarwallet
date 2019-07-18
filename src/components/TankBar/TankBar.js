// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components/native/index';
import { baseColors, fontSizes } from 'utils/variables';
import { MediumText } from 'components/Typography';

type Props = {
  maxValue: number,
  currentValue: number,
};

type State = {
  progressAnimated: Object,
  barWidth: number,
  labelWidth: number,
  labelTransform: number,
  sideButtonWidth: number,
  didFirstAnimation: boolean,
}

const Wrapper = styled.View`
  padding: 20px;
  background-color: ${baseColors.mediumLightGray};
  height: 100px;
`;

const Row = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: flex-start;
`;

const ProgressBarSide = styled.View`
  flex: 1;
`;

const ProgressLabel = styled.View`  
  height: 28px;
  padding: 2px;
  background-color: ${baseColors.white};
  border-radius: 14px;
  flex-direction: row;
  align-items: center;
  z-index: 10;
  position: absolute;
  top: 12px;
  left: 0;
`;
const AnimatedProgressLabel = Animated.createAnimatedComponent(ProgressLabel);

const LabelLine = styled.View`
  height: 8px;
  width: 1px;
  background-color: ${baseColors.shipCove};
  margin: 2px 0;
`;

const AnimatedLabelLine = Animated.createAnimatedComponent(LabelLine);

const SideButton = styled.TouchableOpacity`
  flex-direction: row;
  padding-left: 12px;
  margin-bottom: -2px;
`;

const ProgressBarWrapper = styled.View`
  flex-direction: row;
  height: 8px;
  width: 100%;
  border: 1px solid ${baseColors.quartz};
  background-color: ${baseColors.white};
  border-radius: 4px;
  overflow: hidden;
`;

const Progress = styled.View`
  height: 8px;
  border: 1px solid ${baseColors.quartz};
  background-color: ${baseColors.lavender};
  ${props => props.isFull
    ? 'border-width: 0'
    : `margin-top: -1px;
      margin-left: -1px;`}
`;

const AnimatedProgress = Animated.createAnimatedComponent(Progress);

const LabelText = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  margin: 0 6px;
`;

const LabelButton = styled.TouchableOpacity`
  background-color: ${baseColors.electricBlue};
  border-radius: 12px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.white};
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.tiny}px;
  line-height: ${fontSizes.tiny}px;
`;

export default class TankBar extends React.Component<Props, State> {
  static defaultProps = {
    circle: false,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      progressAnimated: new Animated.Value(0),
      barWidth: 0,
      labelWidth: 0,
      labelTransform: 0,
      sideButtonWidth: 0,
      didFirstAnimation: false,
    };
  }

  componentDidMount() {
    this.state.progressAnimated.addListener(({ value }) => this.updateLabelTransform(value));
  }

  updateLabelTransform = (value: number) => {
    const { labelWidth, barWidth, sideButtonWidth } = this.state;
    const barWidthPixels = barWidth * (value / 100);
    const halfLabelWidth = labelWidth / 2;
    let labelTransform = -(labelWidth / 2);
    if (barWidthPixels <= halfLabelWidth) {
      labelTransform = -barWidthPixels;
    } else if (sideButtonWidth <= halfLabelWidth) {
      labelTransform = -(halfLabelWidth - (sideButtonWidth - halfLabelWidth));
    }
    this.setState({ labelTransform });
  };

  firstAnimate = () => {
    this.setState({ didFirstAnimation: true });
    const { maxValue, currentValue } = this.props;
    this.handleStatusValue(maxValue, currentValue);
  };

  handleStatusValue = (full: number, current: number) => {
    let currentStatus = Math.floor((current * 100) / full);
    if (current > full) currentStatus = 100;
    this.animateProgress(currentStatus);
  };

  componentDidUpdate(prevProps: Props) {
    const { maxValue, currentValue } = this.props;
    if (prevProps.currentValue !== currentValue) {
      this.handleStatusValue(maxValue, currentValue);
    }
  }
  animateProgress = (newProgress: number) => {
    Animated.spring(this.state.progressAnimated, {
      toValue: newProgress,
      duration: 400,
      bounciness: 2,
    }).start();
  };

  render() {
    const {
      progressAnimated,
      barWidth,
      sideButtonWidth,
      labelTransform,
      didFirstAnimation,
    } = this.state;
    const { maxValue, currentValue } = this.props;

    return (
      <Wrapper>
        <Row>
          <ProgressBarSide>
            <ProgressBarWrapper
              onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                this.setState({ barWidth: width });
              }}
            >
              <AnimatedProgress
                style={{
                  width: progressAnimated.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }}
                isFull={maxValue === currentValue || currentValue > maxValue}
              />
            </ProgressBarWrapper>
          </ProgressBarSide>
          <SideButton
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              this.setState({ sideButtonWidth: width });
            }}
          >
            <Value>{maxValue}</Value>
            <Value>PLR</Value>
          </SideButton>
        </Row>
        {!!barWidth && !!sideButtonWidth &&
        <Row>
          <AnimatedLabelLine
            style={{
              transform: [{
                translateX: progressAnimated.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, barWidth],
                }),
              }],
              marginLeft: -2,
            }}
          />
          <AnimatedProgressLabel
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              this.setState({ labelWidth: width });
              if (!didFirstAnimation) this.firstAnimate();
            }}
            style={{
              transform: [{ translateX: labelTransform }],
              left: progressAnimated.interpolate({
                inputRange: [0, 100],
                outputRange: [0, barWidth],
              }),
            }}
          >
            <LabelText>{`${currentValue} PLR`}</LabelText>
            <LabelButton>
              <ButtonText>Top up</ButtonText>
            </LabelButton>
          </AnimatedProgressLabel>
        </Row>}
      </Wrapper>
    );
  }
}
