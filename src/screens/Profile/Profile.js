// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import { List, ListItem, Icon, Body, Right, Switch, Toast } from 'native-base';
import { changeRequestPinForTransactionAction } from 'actions/profileActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { Label } from 'components/Typography';
import { Container, ScrollWrapper } from 'components/Layout';
import { Grid, Row, Column } from 'components/Grid';
import Title from 'components/Title';
import CurrencySelector from 'components/ProfileSettings/CurrencySelector';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import ModalScreenHeader from 'components/ModalScreenHeader';
import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import ProfileHeader from './ProfileHeader';
import ProfileCard from './ProfileCard';

const storage = new Storage('db');

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
  font-size: ${fontSizes.small};
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
  color: ${props => props.lastSynced ? baseColors.freshEucalyptus : baseColors.darkGray};
  text-align: ${props => props.lastSynced ? 'center' : 'left'};
`;

const ListItemText = styled.Text`
  font-size: ${fontSizes.small};
  margin: 10px 4px;
`;

const leftColumnSize = '0 0 100px';

const CheckPinModal = styled(SlideModal)`
  align-items: flex-start;
`;

type Props = {
  user: Object,
  wallet: Object,
  appSettings: Object,
  navigation: NavigationScreenProp<*>,
  changeRequestPinForTransaction: (value: boolean) => Function,
  resetIncorrectPassword: () => Function,
};

type State = {
  requestPinForTransaction: boolean,
  showCheckPinModal: boolean,
};

class Profile extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    let { requestPinForTransaction } = props.appSettings;
    if (requestPinForTransaction === undefined) {
      requestPinForTransaction = false;
    }

    this.state = {
      requestPinForTransaction,
      showCheckPinModal: false,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { requestPinForTransaction } = nextProps.appSettings;
    if (requestPinForTransaction !== undefined && requestPinForTransaction !== prevState.requestPinForTransaction) {
      return {
        ...prevState,
        requestPinForTransaction,
      };
    }
    return null;
  }

  clearLocalStorage() {
    storage.removeAll();
    Toast.show({
      text: 'Cleared',
      buttonText: '',
    });
  }

  handleChangeRequestPinForTransaction = (value) => {
    const { changeRequestPinForTransaction } = this.props;
    changeRequestPinForTransaction(value);
    this.setState({
      showCheckPinModal: false,
    });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
  };

  render() {
    const { user, wallet } = this.props;
    const { requestPinForTransaction, showCheckPinModal } = this.state;
    return (
      <Container>
        <ScrollWrapper>
          <ProfileHeader>
            <Title title="profile" />
            <ProfileCard name={`${user.firstName} ${user.lastName}`} email="johndoe@email.com" />
          </ProfileHeader>
          <ProfileInfoItem>
            <Grid>
              <Row>
                <Column size={leftColumnSize}>
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
                <Column size={leftColumnSize}>
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
                <Column size={leftColumnSize}>
                  <ProfileInfoLabel>Phone</ProfileInfoLabel>
                </Column>
                <Column>
                  <ProfileInfoValue>+410000000000</ProfileInfoValue>
                </Column>
              </Row>
            </Grid>
          </ProfileInfoItem>
          <List>
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
            <ListItem noBorder>
              <Body>
                <ListItemText>Base Currency</ListItemText>
              </Body>
              <Right>
                <CurrencySelector />
              </Right>
            </ListItem>
            <ListSeparator>
              <ListSeparatorText>SECURITY</ListSeparatorText>
            </ListSeparator>
            {wallet.mnemonic && (
              <ListItem onPress={() => this.props.navigation.navigate(REVEAL_BACKUP_PHRASE)}>
                <Body>
                  <ListItemText>Backup Wallet</ListItemText>
                </Body>
                <Right>
                  <Icon name="arrow-forward" />
                </Right>
              </ListItem>
            )}
            <ListItem onPress={() => this.props.navigation.navigate(CHANGE_PIN_FLOW)}>
              <Body>
                <ListItemText>Change Pin</ListItemText>
              </Body>
              <Right>
                <Icon name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem noBorder>
              <Body>
                <ListItemText>Request Pin for Transaction</ListItemText>
              </Body>
              <Right>
                <Switch
                  value={requestPinForTransaction}
                  onValueChange={() => this.setState({ showCheckPinModal: true })}
                />
              </Right>
            </ListItem>
            <CheckPinModal
              isVisible={showCheckPinModal}
              title="confirm"
              fullScreenComponent={(
                <Container>
                  <ModalScreenHeader onClose={this.handleCheckPinModalClose} />
                  <CheckPin onPinValid={() => this.handleChangeRequestPinForTransaction(!requestPinForTransaction)} />
                </Container>
              )}
            />
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
            <ListSeparator>
              <ListSeparatorText>DEBUG</ListSeparatorText>
            </ListSeparator>
            <ListItem noBorder onPress={this.clearLocalStorage}>
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
          </List>
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  wallet: { data: wallet },
  appSettings: { data: appSettings },
}) => ({
  user,
  wallet,
  appSettings,
});

const mapDispatchToProps = (dispatch: Function) => ({
  changeRequestPinForTransaction: (value) => {
    dispatch(changeRequestPinForTransactionAction(value));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
