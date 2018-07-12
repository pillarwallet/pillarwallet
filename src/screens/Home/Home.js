// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';


type Props = {
  navigation: NavigationScreenProp<*>,

}

type State = {

}

const dummyHistory = [
  {
    type: 'transactionEvent',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        type: 'BCX',
        msg: '{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH","value":"0.5","status":"pending"}',
      },
    },
  },
  {
    type: 'social',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        label: 'New chat started',
        connection: 'michael',
        status: 'MESSAGE_RECEIVED',
      },
    },
  },
  {
    type: 'transactionEvent',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        type: 'BCX',
        msg: '{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH","value":"0.5","status":"pending"}',
      },
    },
  },
  {
    type: 'transactionEvent',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        type: 'BCX',
        msg: '{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH","value":"0.5","status":"pending"}',
      },
    },
  },
  {
    type: 'transactionEvent',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        type: 'BCX',
        msg: '{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH","value":"0.5","status":"pending"}',
      },
    },
  },
  {
    type: 'transactionEvent',
    meta: {
      recipientWalletId: 'b0098c1a-2c99-46e4-841b-57e244e81660',
    },
    payload: {
      notification: {
        title: 'Pillar',
        body: 'You received 10 ETH',
      },
      data: {
        type: 'BCX',
        msg: '{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH","value":"0.5","status":"pending"}',
      },
    },
  },
];

const HomeHeader = styled.View`
  height: 120px;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
`;


const HomeHeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 10px;
  background-color: ${baseColors.darkGray};
`;


const HomeHeaderUsername = styled.Text`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold};
`;

const RecentConnections = styled.View`
  height: 140px;
  background-color: ${baseColors.lightGray};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
  padding: 0 16px;
`;

export default class PeopleScreen extends React.Component<Props, State> {
  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <HomeHeader>
            <HomeHeaderAvatar />
            <HomeHeaderUsername>johndoe</HomeHeaderUsername>
          </HomeHeader>
        </Wrapper>
        <RecentConnections />
        <ActivityFeed history={dummyHistory} />
      </Container>
    );
  }
}

