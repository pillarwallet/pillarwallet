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
import get from 'lodash.get';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

type Props = {
  maxValue: number,
  currentValue: number,
  currentValueFormatted: string,
  topupAction: Function,
  topUpLoading: boolean,
  disabled: boolean,
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
  background-color: ${baseColors.white};
  border-bottom-width: 1px;
  border-bottom-color: ${baseColors.mediumLightGray};
`;

const Row = styled.View`
  flex-direction: row;
  width: 100%;
`;

const Title = styled(MediumText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.blueYonder};
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
  elevation: 5;
  shadow-color: ${baseColors.black};
  shadow-radius: 4px;
  shadow-opacity: 0.3;
  shadow-offset: 0px 2px;
`;

const AnimatedProgressLabel = Animated.createAnimatedComponent(ProgressLabel);

const LabelLine = styled.View`
  height: 8px;
  width: 1px;
  background-color: ${baseColors.shipCove};
  margin: 2px 0;
`;

const AnimatedLabelLine = Animated.createAnimatedComponent(LabelLine);

// const SideButton = styled.TouchableOpacity`
//   flex-direction: row;
//   padding-left: 12px;
//   margin-bottom: -2px;
// `;

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
  background-color: ${props => props.disabled ? baseColors.lightGray : baseColors.electricBlue};
  border-radius: 12px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${props => props.dark ? baseColors.darkGray : baseColors.white};
`;

// const Value = styled(MediumText)`
//   font-size: ${fontSizes.tiny}px;
//   line-height: ${fontSizes.tiny}px;
//   color: ${props => props.color ? props.color : baseColors.slateBlack};
// `;

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
      labelTransform,
      didFirstAnimation,
    } = this.state;
    const {
      maxValue,
      currentValue,
      currentValueFormatted,
      topupAction,
      topUpLoading,
      disabled,
    } = this.props;

    return (
      <Wrapper>
        <Row style={{ marginBottom: spacing.large, marginTop: spacing.small }}>
          <Title>PLR Tank</Title>
        </Row>
        <Row style={{ alignItems: 'flex-start' }}>
          <ProgressBarSide>
            <ProgressBarWrapper
              onLayout={(e) => {
                const width = get(e, 'nativeEvent.layout.width', 200);
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
          {/* <SideButton
            onLayout={(e) => {
              const width = get(e, 'nativeEvent.layout.width', 80);
              this.setState({ sideButtonWidth: width });
            }}
          >
            <Value color={baseColors.darkGray}>{maxValue}</Value>
            <Value style={{ marginLeft: 4 }}>{PPN_TOKEN}</Value>
          </SideButton> */ }
        </Row>
        {!!barWidth && /* add !!sideButtonWidth if SideButton is present! */
        <Row style={{ height: 40 }}>
          <AnimatedLabelLine
            style={{
              transform: [{
                translateX: progressAnimated.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, barWidth],
                }),
              }],
              marginLeft: currentValue < 10 ? 0 : -2,
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
            <LabelText>{`${currentValueFormatted} ${PPN_TOKEN}`}</LabelText>
            <LabelButton
              onPress={!topUpLoading || disabled ? () => { topupAction(); } : null}
              disabled={topUpLoading || disabled}
            >
              {!topUpLoading && <ButtonText dark={disabled}>Top up</ButtonText>}
              {topUpLoading && <Spinner width={20} height={20} />}
            </LabelButton>
          </AnimatedProgressLabel>
        </Row>}
      </Wrapper>
    );
  }
}
