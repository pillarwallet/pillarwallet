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
import { Platform, Animated, Easing } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import t from 'translations/translate';

import { fontStyles, fontTrackings } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { MediumText } from 'components/legacy/Typography';
import type { Theme } from 'models/Theme';


type Props = {
  isPending?: boolean,
  fullStatusValue: number,
  currentStatusValue: number,
  theme: Theme,
  showLabel?: boolean,
  activeTab?: string,
  colorStart?: string,
  colorEnd?: string,
  height?: number,
  barPadding?: number,
  emptyBarBackgroundColor?: string,
  emptyBarBorder?: boolean,
};

type State = {
  label: string,
  progress: number,
  progressAnimated: Object,
};

const ProgressBarWrapper = styled.View`
  flex-direction: row;
  background-color: ${({ backgroundColor }) => backgroundColor};
  padding: ${({ padding }) => padding}px;
  align-items: center;
  justify-content: flex-start;
  border-radius: 10px;
  width: 100%;
  ${({ border }) => border && `
    borderColor: #ebf0ff;
    borderWidth: 1px;
  `}
`;

const StyledLinearGradient = styled(LinearGradient)`
  padding: 1px;
  height: ${({ height }) => height}px;
  border-radius: 10px;
  overflow: hidden;
`;

const AnimatedStyledLinearGradient = Animated.createAnimatedComponent(StyledLinearGradient);

const ProgressLabel = styled(MediumText)`
  ${fontStyles.tiny};
  letter-spacing: ${fontTrackings.tiny};
  color: ${({ outside, theme }) => outside ? theme.colors.primary : theme.colors.control};
  position: ${props => props.outside ? 'relative' : 'absolute'};
  top: ${Platform.select({
    ios: props => props.outside ? 'auto' : '1px',
    android: props => props.outside ? 'auto' : '1.5px',
  })};
  right: ${props => props.outside ? 'auto' : '4px'};
  margin-top: ${Platform.select({
    ios: props => props.outside ? '1px' : '0',
    android: props => props.outside ? '2px' : '0',
  })};
  margin-left: ${props => props.outside ? '2px' : 0};
`;

const BACKGROUND_FOR_LABEL = 8;

class Progress extends React.Component<Props, State> {
  static defaultProps = {
    showLabel: false,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      label: '0',
      progress: !this.props.showLabel ? 0.5 : BACKGROUND_FOR_LABEL,
      progressAnimated: new Animated.Value(!this.props.showLabel ? 0.5 : BACKGROUND_FOR_LABEL),
    };
  }

  componentDidMount() {
    const {
      isPending,
      fullStatusValue,
      currentStatusValue,
    } = this.props;

    if (!isPending) this.handleStatusValue(fullStatusValue, currentStatusValue);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isPending,
      fullStatusValue,
      currentStatusValue,
      activeTab,
    } = this.props;

    if (prevProps.currentStatusValue !== currentStatusValue
      || prevProps.isPending !== isPending
      || prevProps.activeTab !== activeTab
    ) {
      if (prevProps.activeTab !== activeTab) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          label: '0',
          progress: !this.props.showLabel ? 0.5 : BACKGROUND_FOR_LABEL,
          progressAnimated: new Animated.Value(!this.props.showLabel ? 0.5 : BACKGROUND_FOR_LABEL),
        }, () => {
          this.handleStatusValue(fullStatusValue, currentStatusValue);
        });
      } else {
        this.handleStatusValue(fullStatusValue, currentStatusValue);
      }
    }
  }

  handleStatusValue = (full: number, current: number) => {
    if (full > 0) {
      const currentStatus = Math.floor((current * 100) / full);
      const adjustedCurrentStatus = currentStatus > 100 ? 100 : currentStatus;
      const adjustedBarProgress = adjustedCurrentStatus < BACKGROUND_FOR_LABEL
        ? BACKGROUND_FOR_LABEL
        : adjustedCurrentStatus;
      const thisProgress = adjustedBarProgress;
      this.setState({
        label: adjustedCurrentStatus.toString(),
        progress: thisProgress,
      });
      this.animateProgress(thisProgress);
    }
  };

  animateProgress = (newProgress: number) => {
    Animated.timing(
      this.state.progressAnimated,
      {
        toValue: newProgress,
        easing: Easing.linear,
        duration: 500,
        useNativeDriver: false,
      },
    ).start();
  };

  render() {
    const {
      progressAnimated,
      label,
      progress,
    } = this.state;

    const {
      theme,
      showLabel = false,
    } = this.props;

    const colors = getThemeColors(theme);

    const {
      colorStart = colors.progressBarStart,
      colorEnd = colors.progressBarEnd,
      barPadding = 3,
      height = 14,
      emptyBarBackgroundColor = colors.basic070,
      emptyBarBorder,
    } = this.props;

    return (
      <ProgressBarWrapper
        padding={barPadding}
        backgroundColor={emptyBarBackgroundColor}
        border={emptyBarBorder}
      >
        <AnimatedStyledLinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[colorStart, colorEnd]}
          full={progress === 100}
          style={{
            width: progressAnimated.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
          height={height}
        >
          {!!showLabel &&
            <ProgressLabel>{t('percentValue', { value: label })}</ProgressLabel>
          }
        </AnimatedStyledLinearGradient>
      </ProgressBarWrapper>
    );
  }
}

export default withTheme(Progress);
