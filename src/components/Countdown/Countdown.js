// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { MediumText } from 'components/Typography';
import { fontSizes, fontTrackings, baseColors } from 'utils/variables';

type Props = {
  endDate: string,
  fontSize?: number,
  fontColor?: string,
  lineHeight?: number,
  extendedDayLabel?: boolean,
}

type ChildProps = {
  children: React.Node,
  fontSize?: number,
  fontColor?: string,
}

type State = {
  started: boolean,
  days: number,
  hours: number,
  min: number,
  sec: number,
}

const CounterHolder = styled.Text``;

const CountdownWrapper = styled(MediumText)`
  flex-direction: row;
  flex-wrap: wrap;
  letter-spacing: ${fontTrackings.tiny};
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraSmall}px;
  line-height: ${props => props.lineHeight ? props.lineHeight : fontSizes.small}px;
  justify-content: center;
  align-items: center;
`;

const CountdownDigits = styled(MediumText)`
  letter-spacing: ${fontTrackings.tiny};
  font-size: ${props => props.fontSize ? props.fontSize : fontSizes.extraSmall}px;
  color: ${props => props.fontColor ? props.fontColor : baseColors.slateBlack};
`;

class Countdown extends React.Component<Props, State> {
  interval: IntervalID;
  state = {
    started: false,
    days: 0,
    hours: 0,
    min: 0,
    sec: 0,
  };

  componentDidMount() {
    const { endDate } = this.props;
    this.interval = setInterval(() => {
      const date = this.calculateCountdown(new Date(endDate).toString());
      if (date) {
        this.setState({
          started: true,
          ...date,
        });
      } else {
        this.stop();
      }
    }, 1000);
  }

  componentWillUnmount() {
    this.stop();
  }

  calculateCountdown(endDate: string) {
    let difference = (Date.parse(new Date(endDate).toString()) - Date.parse(new Date().toString())) / 1000;
    if (difference <= 0) return false;

    const timeLeft = {
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
    };

    if (difference >= 86400) {
      timeLeft.days = Math.floor(difference / 86400);
      difference -= timeLeft.days * 86400;
    }
    if (difference >= 3600) {
      timeLeft.hours = Math.floor(difference / 3600);
      difference -= timeLeft.hours * 3600;
    }
    if (difference >= 60) {
      timeLeft.min = Math.floor(difference / 60);
      difference -= timeLeft.min * 60;
    }
    timeLeft.sec = difference;

    return timeLeft;
  }

  stop() {
    clearInterval(this.interval);
  }

  formatDoubleDigit(value: number): string {
    let formattedValue = String(value);
    while (formattedValue.length < 2) {
      formattedValue = `0${formattedValue}`;
    }
    return formattedValue;
  }

  render() {
    const {
      started,
      days,
      hours,
      min,
      sec,
    } = this.state;
    const {
      fontSize,
      fontColor,
      extendedDayLabel,
      lineHeight,
    } = this.props;
    const daysLabel = days > 1 ? 'days' : 'day';

    const StyledCountDownDigits = (props: ChildProps) => {
      return (
        <CountdownDigits
          fontSize={fontSize}
          fontColor={fontColor}
        >
          {props.children}
        </CountdownDigits>
      );
    };

    return (
      <CounterHolder>
        {!!started &&
        <CountdownWrapper
          fontSize={fontSize}
          fontColor={fontColor}
          lineHeight={lineHeight}
        >
          {!!days && <StyledCountDownDigits>{days} {extendedDayLabel ? daysLabel : 'd.'} </StyledCountDownDigits>}
          <StyledCountDownDigits>{this.formatDoubleDigit(hours)}:</StyledCountDownDigits>
          <StyledCountDownDigits>{this.formatDoubleDigit(min)}:</StyledCountDownDigits>
          <StyledCountDownDigits>{this.formatDoubleDigit(sec)}</StyledCountDownDigits>
        </CountdownWrapper>}
      </CounterHolder>
    );
  }
}

export default Countdown;
