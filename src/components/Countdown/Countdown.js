// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { MediumText } from 'components/Typography';
import { fontSizes, fontTrackings, baseColors } from 'utils/variables';

type Props = {
  endDate: string,
}

type State = {
  started: boolean,
  days: number,
  hours: number,
  min: number,
  sec: number,
}

const CounterHolder = styled.View`
`;

const CountdownWrapper = styled.View`
  flex-direction: row;
`;

const CountdownDigits = styled(MediumText)`
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.mediumLarge};
  color: ${baseColors.slateBlack};
  letter-spacing: ${fontTrackings.tiny};
`;

class Countdown extends React.Component<Props, State> {
  interval: IntervalID;

  constructor(props: Props) {
    super(props);
    this.state = {
      started: false,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
    };
  }

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

  formatDoubleDigit(value: any) {
    let thisValue = String(value);
    while (thisValue.length < 2) {
      thisValue = `0${thisValue}`;
    }
    return thisValue;
  }

  render() {
    const countDown = this.state;

    return (
      <CounterHolder>
        {!!this.state.started &&
        <CountdownWrapper>
          <CountdownDigits>{this.formatDoubleDigit(countDown.days)}d. </CountdownDigits>
          <CountdownDigits>{this.formatDoubleDigit(countDown.hours)}:</CountdownDigits>
          <CountdownDigits>{this.formatDoubleDigit(countDown.min)}:</CountdownDigits>
          <CountdownDigits>{this.formatDoubleDigit(countDown.sec)}</CountdownDigits>
        </CountdownWrapper>}
      </CounterHolder>
    );
  }
}

export default Countdown;
