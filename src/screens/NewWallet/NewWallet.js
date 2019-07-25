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
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native';

import { Container, Wrapper } from 'components/Layout';
import { BaseText, BoldText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import { REGISTRATION_FAILED, USERNAME_EXISTS } from 'constants/walletConstants';
import { APP_FLOW } from 'constants/navigationConstants';
import { baseColors, fontSizes } from 'utils/variables';

const API_FAILURES = [USERNAME_EXISTS, REGISTRATION_FAILED];

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

type State = {
  visibleMessageId: number,
}

const messages = [
  'Yes, it takes time to load.',
  'There’s so many things going on.',
  'Decentralization isn’t easy.',
];

const MessageText = styled(BoldText)`
  font-size: ${fontSizes.extraLarge}px;
  line-height: 40px;
  color: ${baseColors.slateBlack};
  margin-top: 42px;
  margin-right: 34px;
`;

class NewWallet extends React.Component<Props, State> {
  timer: ?IntervalID;
  state = {
    visibleMessageId: 0,
  };

  componentDidMount() {
    this.timer = setInterval(() => this.changeMessages(), 6000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  changeMessages = () => {
    const { visibleMessageId } = this.state;
    const lastMessageId = messages.length - 1;
    const nextMessageId = visibleMessageId === lastMessageId ? 0 : visibleMessageId + 1;
    this.setState({ visibleMessageId: nextMessageId });
  };

  render() {
    const { wallet, navigation } = this.props;
    const { visibleMessageId } = this.state;
    const { walletState } = wallet;
    const message = messages[visibleMessageId] || '';

    const tryToReRegister = () => {
      navigation.navigate(APP_FLOW);
    };

    const failedToRegister = API_FAILURES.includes(walletState);

    return (
      <Container center={failedToRegister}>
        {!failedToRegister && (
          <Wrapper fullscreen style={{ justifyContent: 'center', padding: 56, flex: 1 }}>
            <Spinner />
            <MessageText>{message}</MessageText>
          </Wrapper>
        )}
        {failedToRegister && (
          <Wrapper fullScreen center flex={1}>
            <BaseText style={{ marginBottom: 20 }} bigText={!failedToRegister}>
              Registration failed
            </BaseText>
            <Button title="Try again" onPress={tryToReRegister} />
          </Wrapper>
        )}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
