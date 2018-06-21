// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import Storage from 'services/storage';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { Container, ScrollWrapper } from 'components/Layout';
import { Toast } from 'native-base';
import { Text, TouchableHighlight, Modal, View} from 'react-native';
import { CHANGE_PIN_FLOW, REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';
import PortfolioBalance from 'components/PortfolioBalance';
import ProfileHeader from './ProfileHeader';
import ProfileSettingsItem from './ProfileSettingsItem';
import ProfileImage from './ProfileImage';

const storage = new Storage('db');

const ProfileName = styled.Text`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold}
`;

const ListWrapper = styled.View`
  padding-bottom: 40px;
  background-color: ${baseColors.lighterGray};
`;

const FlexRowSpaced = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ListSeparator = styled.View`
  padding: 5px 30px 15px 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
  background-color: ${baseColors.lighterGray};
`;

const ListSeparatorText = styled.Text`
  margin-top: 30px;
  color: ${props => props.lastSynced ? baseColors.lightGreen : baseColors.darkGray};
  text-align: ${props => props.lastSynced ? 'center' : 'left'};
  font-size: ${fontSizes.small};
`;

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
}

type State = {
  modalVisible: boolean
}

class Profile extends React.Component<Props, State> {
  state = {
    modalVisible: false,
  };

  clearLocalStorage() {
    storage.removeAll();
    Toast.show({
      text: 'Cleared',
      buttonText: '',
    });
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  render() {
    // user, wallet
    const { user } = this.props;

    return (
      <Container>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            alert('Modal has been closed.');
          }}
        >
          <View style={{ marginTop: 22 }}>
            <View>
              <Text>Hello World!</Text>

              <TouchableHighlight
                onPress={() => {
                  this.setModalVisible(!this.state.modalVisible);
                }}
              >
                <Text>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
        <ScrollWrapper>
          <ProfileHeader>
            <FlexRowSpaced>
              <ProfileName>{`${user.firstName} ${user.lastName}`}</ProfileName>
              <ProfileImage uri={user.profileImage} userName={`${user.firstName} ${user.lastName}`} />
            </FlexRowSpaced>
            <PortfolioBalance />
          </ProfileHeader>

          <ListWrapper>
            <ListSeparator>
              <ListSeparatorText>PROFILE SETTINGS</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="country"
              label="Country"
              value={user.country}
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ProfileSettingsItem
              key="city"
              label="City"
              value={user.city}
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ProfileSettingsItem
              key="email"
              label="Email"
              value={user.email}
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ProfileSettingsItem
              key="phone"
              label="Phone"
              value={user.phone}
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ListSeparator>
              <ListSeparatorText>GENERAL SETTINGS</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="baseCurrency"
              label="Base currency"
              value="GBP"
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ProfileSettingsItem
              key="backupWallet"
              label="Backup wallet"
              onPress={() => this.props.navigation.navigate(REVEAL_BACKUP_PHRASE)}
            />

            <ProfileSettingsItem
              key="changePin"
              label="Change PIN"
              onPress={() => this.props.navigation.navigate(CHANGE_PIN_FLOW)}
            />

            <ProfileSettingsItem
              key="requestPin"
              label="Request PIN for transaction"
              value={1}
              toggle
              onPress={null}
            />

            <ListSeparator />

            <ProfileSettingsItem
              key="aboutWallet"
              label="About Pillar wallet"
              onPress={() => { this.setModalVisible(!this.state.modalVisible); }}
            />

            <ListSeparator>
              <ListSeparatorText>DEBUG</ListSeparatorText>
            </ListSeparator>

            <ProfileSettingsItem
              key="clearStorage"
              label="Clear Local Storage"
              onPress={() => { this.clearLocalStorage(); }}
            />
          </ListWrapper>

        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ user: { data: user }, wallet: { data: wallet } }) => ({
  user,
  wallet,
});

export default connect(mapStateToProps)(Profile);
