// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { SubHeading } from 'components/Typography';
import PortfolioBalance from 'components/PortfolioBalance';

import ButtonIcon from 'components/ButtonIcon';
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';

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
        msg: `{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b",
        "toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH",
        "value":"0.4345","status":"pending"}`,
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
        label: 'Incoming connection',
        connection: 'anna',
        status: 'RECEIVED',
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
        label: 'Connection request sent',
        connection: 'brandon',
        status: 'SENT',
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
        label: 'Incoming connection',
        connection: 'michael',
        status: 'ACCEPTED',
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
        label: 'Incoming connection',
        connection: 'michael',
        status: 'DISMISSED',
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
        msg: `{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b",
        "toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH",
        "value":"1234.5678","status":"pending"}`,
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
        msg: `{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b",
        "toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH",
        "value":"0.5","status":"pending"}`,
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
        msg: `{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b",
        "toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH",
        "value":"0.5","status":"pending"}`,
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
        msg: `{"fromAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b",
        "toAddress":"0x6d24283AA56D2351d714Ae34EB8e6187B273eB0b","asset":"ETH",
        "value":"0.5","status":"pending"}`,
      },
    },
  },
];

const HomeHeader = styled.View`
  height: 120px;
  padding: 0 16px;
  align-content: space-between;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const HomeHeaderRow = styled.View`
  flex: 1;
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

const HomeHeaderButtons = styled.View`
  margin-left: auto;
  flex-direction: row;
  align-items: flex-end;
`;

const HomeHeaderButton = styled(ButtonIcon)`
  margin-left: 10px;
`;

const RecentConnections = styled.View`
  height: 140px;
  background-color: ${baseColors.lightGray};
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const RecentConnectionsScrollView = styled.ScrollView`

`;

const RecentConnectionsSubHeading = styled(SubHeading)`
  margin: 16px;
`;


const RecentConnectionsItem = styled.TouchableOpacity`
  align-items: center;
  width: 64px;
  margin: 0 8px;
`;

const RecentConnectionsItemAvatarWrapper = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${baseColors.darkGray};
  border: 2px solid white;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
  margin-bottom: 10px;
`;

const RecentConnectionsItemAvatarImage = styled.Image`
`;

const RecentConnectionsItemName = styled.Text`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.darkGray};
`;


type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  user: Object,
};

class PeopleScreen extends React.Component<Props> {
  goToProfile = () => {
    const { navigation } = this.props;
    navigation.navigate(PROFILE);
  };

  renderRecentConnections = () => {
    const { contacts, navigation } = this.props;
    return contacts.map(contact => (
      <RecentConnectionsItem
        key={contact.username}
        onPress={() => navigation.navigate(CONTACT, { contact })}
      >
        <RecentConnectionsItemAvatarWrapper>
          <RecentConnectionsItemAvatarImage />
        </RecentConnectionsItemAvatarWrapper>
        <RecentConnectionsItemName numberOfLines={1}>{contact.username}</RecentConnectionsItemName>
      </RecentConnectionsItem>
    ));
  };

  render() {
    const { user } = this.props;
    return (
      <Container>
        <HomeHeader>
          <HomeHeaderRow>
            <HomeHeaderAvatar />
            <HomeHeaderUsername>{user.username}</HomeHeaderUsername>
            <HomeHeaderButtons>
              <HomeHeaderButton
                icon="question-circle-o"
                type="FontAwesome"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => Intercom.displayMessenger()}
              />
              <HomeHeaderButton
                icon="cog"
                type="FontAwesome"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => this.goToProfile()}
              />
            </HomeHeaderButtons>
          </HomeHeaderRow>
          <HomeHeaderRow>
            <PortfolioBalance />
          </HomeHeaderRow>
        </HomeHeader>
        <ScrollWrapper>
          <RecentConnections>
            <RecentConnectionsSubHeading>RECENT CONNECTIONS</RecentConnectionsSubHeading>
            <RecentConnectionsScrollView horizontal>
              {this.renderRecentConnections()}
            </RecentConnectionsScrollView>
          </RecentConnections>
          <ActivityFeed history={dummyHistory} />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
}) => ({
  contacts,
  user,
});

export default connect(mapStateToProps)(PeopleScreen);
