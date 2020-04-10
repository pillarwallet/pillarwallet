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
import styled from 'styled-components/native';

import { Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  messages?: Array<string>,
  noMessages?: boolean,
  firstMessageWithoutDelay?: boolean,
};

type State = {
  visibleMessageId: number,
  showMessage: boolean,
}

const defaultMessages = [
  'It might take a bit.',
  'Loading...',
];

const ContentHolder = styled.View`
  position: relative;
  margin-top: -20px;
`;

const MessageText = styled(MediumText)`
  ${fontStyles.large};
  color: ${themedColors.text};
  position: absolute;
  top: 62px;
  left: 0;
`;

const AnimatedMessageText = Animated.createAnimatedComponent(MessageText);

export default class Loader extends React.Component<Props, State> {
  timerToChangeMessage: ?IntervalID;
  startTimeout: ?TimeoutID;

  constructor(props: Props) {
    super(props);
    this.state = {
      visibleMessageId: 0,
      showMessage: !!props.firstMessageWithoutDelay,
    };
  }

  componentDidMount() {
    const { noMessages } = this.props;
    if (noMessages) return;
    this.timerToChangeMessage = setInterval(() => this.changeMessages(), 6000);
    this.startTimeout = setTimeout(() => {
      this.showMessage();
    }, 2000);
  }

  showMessage = () => {
    this.setState({ showMessage: true });
  };

  componentWillUnmount() {
    if (this.timerToChangeMessage) clearInterval(this.timerToChangeMessage);
    if (this.startTimeout) clearTimeout(this.startTimeout);
  }

  changeMessages = () => {
    const { visibleMessageId } = this.state;
    const { messages } = this.props;
    const messagesToShow = messages || defaultMessages;
    if (messagesToShow.length < 2) return;
    const lastMessageId = messagesToShow.length - 1;
    const nextMessageId = visibleMessageId === lastMessageId ? 0 : visibleMessageId + 1;
    this.setState({ visibleMessageId: nextMessageId });
  };

  render() {
    const { visibleMessageId, showMessage } = this.state;
    const { messages } = this.props;
    const messagesToShow = messages || defaultMessages;
    const message = messagesToShow[visibleMessageId] || '';

    return (
      <Wrapper fullScreen style={{ justifyContent: 'center', alignItems: 'flex-start', padding: 56 }}>
        <ContentHolder>
          <Spinner />
          {!!showMessage && <AnimatedMessageText>{message}</AnimatedMessageText>}
        </ContentHolder>
      </Wrapper>
    );
  }
}
