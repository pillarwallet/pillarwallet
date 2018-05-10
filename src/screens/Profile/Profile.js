// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { AsyncStorage, Text } from 'react-native';
import { UIColors, fontSizes } from 'utils/variables';
import { Label } from 'components/Typography';
import { Container, Footer } from 'components/Layout';
import { Grid, Row, Column } from 'components/Grid';
import { List, ListItem } from 'native-base';
import Title from 'components/Title';
import Button from 'components/Button';
import ProfileHeader from './ProfileHeader';
import ProfileCard from './ProfileCard';

type State = {
  status: string,
}

const ProfileInfoItem = styled.View`
  margin-left: 20px;
  padding: 20px 20px 20px 0;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const ProfileInfoLabel = styled(Label)`
  margin-bottom: 0;
  line-height: 24px;
`;

const ProfileInfoValue = styled.Text`
  font-size: ${fontSizes.large};
  text-align: right;
`;

export default class Profile extends React.Component<{}, State> {
  state = {
    status: '',
  };

  clearLocalStorage = () => {
    AsyncStorage.clear();
    this.setState({
      status: 'Cleared',
    });
  };

  render() {
    const { status } = this.state;
    return (
      <Container>
        <ProfileHeader>
          <Title title="profile" />
          <ProfileCard name="David Bowie" email="johndoe@email.com" />
        </ProfileHeader>
        <ProfileInfoItem>
          <Grid>
            <Row>
              <Column size="0 0 100px">
                <ProfileInfoLabel>Country</ProfileInfoLabel>
              </Column>
              <Column>
                <ProfileInfoValue>United Kingdom</ProfileInfoValue>
              </Column>
            </Row>
          </Grid>
        </ProfileInfoItem>
        <ProfileInfoItem>
          <Grid>
            <Row>
              <Column size="0 0 100px">
                <ProfileInfoLabel>City</ProfileInfoLabel>
              </Column>
              <Column>
                <ProfileInfoValue>London</ProfileInfoValue>
              </Column>
            </Row>
          </Grid>
        </ProfileInfoItem>
        <ProfileInfoItem>
          <Grid>
            <Row>
              <Column size="0 0 100px">
                <ProfileInfoLabel>Phone</ProfileInfoLabel>
              </Column>
              <Column>
                <ProfileInfoValue>+410000000000</ProfileInfoValue>
              </Column>
            </Row>
          </Grid>
        </ProfileInfoItem>
        <Footer>
          <Button
            block
            marginBottom="20px"
            title="Clear Local Storage"
            onPress={this.clearLocalStorage}
          />
          {status && <Text>{status}</Text>}
        </Footer>
      </Container>
    );
  }
}
