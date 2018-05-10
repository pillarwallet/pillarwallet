// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { AsyncStorage } from 'react-native';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { Label } from 'components/Typography';
import { Container, Wrapper } from 'components/Layout';
import { Grid, Row, Column } from 'components/Grid';
import { List, ListItem, Icon, Body, Right, Switch } from 'native-base';
import Title from 'components/Title';
import ProfileHeader from './ProfileHeader';
import ProfileCard from './ProfileCard';

type State = {
  status: string,
}

const ProfileInfoItem = styled.View`
  margin-left: 20px;
  padding: 20px 20px 20px 0;
  border-bottom-width: ${props => props.noBorder ? '0' : '1px'};
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const ProfileInfoLabel = styled(Label)`
  margin-bottom: 0;
  line-height: 24px;
`;

const ProfileInfoValue = styled.Text`
  font-size: ${fontSizes.medium};
  text-align: right;
`;

const ListSeparator = styled.View`
  padding: 10px 20px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  background-color: ${baseColors.lightGray};
`;

const ListSeparatorText = styled.Text`
  color: ${props => props.lastSynced ? baseColors.lightGreen : baseColors.darkGray};
  text-align: ${props => props.lastSynced ? 'center' : 'left'};
`;

const ListItemText = styled.Text`
  font-size: ${fontSizes.medium};
  margin: 10px 4px;
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
        <Wrapper>
          <ProfileHeader>
            <Title title="profile" />
            <ProfileCard name="David Bowie" email="johndoe@email.com" />
          </ProfileHeader>
          {status &&
          <ProfileInfoItem>
            <Grid>
              <Row>
                <Column size="0 0 100px">
                  <ProfileInfoLabel>Storage Status</ProfileInfoLabel>
                </Column>
                <Column>
                  <ProfileInfoValue>{status}</ProfileInfoValue>
                </Column>
              </Row>
            </Grid>
          </ProfileInfoItem>}
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
          <ProfileInfoItem noBorder>
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
          <List>
            <ListSeparator>
              <ListSeparatorText>DEBUG</ListSeparatorText>
            </ListSeparator>
            <ListItem onPress={this.clearLocalStorage}>
              <Body>
                <ListItemText>Clear Local Storage</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListSeparator>
              <ListSeparatorText lastSynced>Last Synced 00:01:02 Feb 2, 2018</ListSeparatorText>
            </ListSeparator>
            <ListItem>
              <Body>
                <ListItemText>Manage Account</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListSeparator>
              <ListSeparatorText>SETTINGS</ListSeparatorText>
            </ListSeparator>
            <ListItem>
              <Body>
                <ListItemText>Base Currency</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListSeparator>
              <ListSeparatorText>SECURITY</ListSeparatorText>
            </ListSeparator>
            <ListItem>
              <Body>
                <ListItemText>Backup Wallet</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem>
              <Body>
                <ListItemText>Change Pin</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem>
              <Body>
                <ListItemText>Request Pin at Startup</ListItemText>
              </Body>
              <Right>
                <Switch value={false} />
              </Right>
            </ListItem>
            <ListItem>
              <Body>
                <ListItemText>Request Pin for Transaction</ListItemText>
              </Body>
              <Right>
                <Switch value={false} />
              </Right>
            </ListItem>
            <ListSeparator>
              <ListSeparatorText>ABOUT</ListSeparatorText>
            </ListSeparator>
            <ListItem>
              <Body>
                <ListItemText>Support Center</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem>
              <Body>
                <ListItemText>Terms of Use</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem>
              <Body>
                <ListItemText>Privacy Policy</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
          </List>
        </Wrapper>
      </Container>
    );
  }
}
