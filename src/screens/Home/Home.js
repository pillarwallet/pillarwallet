// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';


type Props = {
  navigation: NavigationScreenProp<*>,

}

type State = {

}

const HomeHeader = styled.View``;

const RecentConnections = styled.View``;

const ActivityFeed = styled.View``;

export default class PeopleScreen extends React.Component<Props, State> {
  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <HomeHeader />
          <RecentConnections />
          <ActivityFeed />
        </Wrapper>
      </Container>
    );
  }
}

