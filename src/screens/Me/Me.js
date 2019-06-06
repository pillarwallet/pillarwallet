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
import { Dimensions, FlatList } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { ScrollWrapper, Container } from 'components/Layout';
import { baseColors } from 'utils/variables';
import { Shadow } from 'components/Shadow';
import ProfileImage from 'components/ProfileImage/ProfileImage';
import QRCodeScanner from 'components/QRCodeScanner';
import CircleButton from 'components/CircleButton';
import SettingsListItem from 'components/ListItem/SettingsItem';
import Header from 'components/Header';
import {
  onWalletConnectSessionRequest,
  cancelWaitingRequest,
} from 'actions/walletConnectActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import { MANAGE_DETAILS_SESSIONS } from 'constants/navigationConstants';
import * as styled from './styles';

const iconReceive = require('assets/icons/icon_receive.png');

type State = {
  isScanning: boolean,
  showActiveSessions: boolean,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  connectors: any[],
  pending: any[],
  waitingRequest?: string,
  clearPendingWalletConnectSessionByUrl: (url: string) => void,
  killWalletConnectSessionByUrl: (url: string) => void,
  onWalletConnectSessionRequest: (uri: string) => void,
  onWalletLinkScan: (uri: string) => void,
  cancelWaitingRequest: (clientId: string) => void,
};

class MeScreen extends React.Component<Props, State> {
  state = {
    isScanning: false,
    showActiveSessions: false,
  };

  validateWalletConnectQRCode = (uri: string) => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  toggleQRScanner = () => this.setState({ isScanning: !this.state.isScanning });

  handleQRScannerClose = () => this.setState({ isScanning: false });

  handleQRRead = (uri: string) => {
    if (uri.startsWith('wc:')) {
      this.props.onWalletConnectSessionRequest(uri);
    } else {
      this.props.onWalletLinkScan(uri);
    }
    this.handleQRScannerClose();
  };

  cancelWaiting = () => {
    const { waitingRequest } = this.props;

    if (waitingRequest) {
      this.props.cancelWaitingRequest(waitingRequest);
    }
  }

  meSettingsItems = () => {
    const { navigation } = this.props;
    return [
      {
        key: 'manageDetailsSessions',
        title: 'Manage Sessions',
        onPress: () => navigation.navigate(MANAGE_DETAILS_SESSIONS),
      },
    ];
  };

  render() {
    const { showActiveSessions } = this.state;
    const { user } = this.props;

    const height = 330;
    const { width } = Dimensions.get('window');

    return (
      <Container
        inset={{ bottom: 0 }}
        hideSheet={!showActiveSessions}
      >
        <Header title="me" white />
        <ScrollWrapper>
          <styled.CardContainer>
            <styled.Card>
              <Shadow
                heightAndroid={height}
                heightIOS={height}
                widthIOS={width - 40}
                widthAndroid={width - 40}
                shadowRadius={6}
                shadowDistance={0}
                shadowSpread={10}
                shadowOffsetX={0}
                shadowOffsetY={1}
                shadowColorOS={baseColors.mediumLightGray}
                shadowBorder={8}
              >
                <styled.CardBoard height={height}>
                  <styled.Username>{user.username}</styled.Username>

                  <ProfileImage
                    noShadow
                    uri={`${user.profileImage}?t=${user.lastUpdateTime || 0}`}
                    userName={user.username}
                    initialsSize={60}
                    diameter={128}
                  />

                  {this.renderNewSession()}
                </styled.CardBoard>
              </Shadow>
            </styled.Card>
          </styled.CardContainer>

          <FlatList
            data={this.meSettingsItems()}
            renderItem={({ item: { key, title, onPress } }) => (
              <SettingsListItem key={key} label={title} onPress={onPress} />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </ScrollWrapper>

        <QRCodeScanner
          validator={this.validateWalletConnectQRCode}
          isActive={this.state.isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
      </Container>
    );
  }

  renderNewSession() {
    const { waitingRequest } = this.props;

    if (waitingRequest) {
      return (
        <styled.NewSession>
          <styled.StatusMessage>
            Adding session ...
          </styled.StatusMessage>
          <styled.LoadingSpinner />
          <styled.CancelButton
            buttonText="Cancel"
            onPress={this.cancelWaiting}
          />
        </styled.NewSession>
      );
    }

    return (
      <styled.NewSession>
        <CircleButton label="New Session" icon={iconReceive} onPress={this.toggleQRScanner} />
      </styled.NewSession>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  walletConnect: { connectors, pending, waitingRequest },
}) => ({
  user,
  connectors,
  pending,
  waitingRequest,
});

const mapDispatchToProps = dispatch => ({
  onWalletConnectSessionRequest: uri => dispatch(onWalletConnectSessionRequest(uri)),
  onWalletLinkScan: uri => dispatch(executeDeepLinkAction(uri)),
  cancelWaitingRequest: clientId => dispatch(cancelWaitingRequest(clientId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
