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
import { Text, Dimensions, FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Center, ScrollWrapper } from 'components/Layout';
import { baseColors, fontSizes } from 'utils/variables';
import { Shadow } from 'components/Shadow';
import Header from 'components/Header';
import ContainerWithBottomSheet from 'components/Layout/ContainerWithBottomSheet';
import ProfileImage from 'components/ProfileImage/ProfileImage';
import QRCodeScanner from 'components/QRCodeScanner';
import CircleButton from 'components/CircleButton';
import SettingsListItem from 'components/ListItem/SettingsItem';
import { onWalletConnectSessionRequest } from 'actions/walletConnectActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import * as styled from './styles';

const iconReceive = require('assets/icons/icon_receive.png');

type State = {
  activeTab: string,
  isScanning: boolean,
  showActiveSessions: boolean,
};

type Props = {
  user: Object,
  connectors: any[],
  pending: any[],
  onWalletConnectSessionRequest: (uri: string) => void,
  onWalletLinkScan: (uri: string) => void,
};

const ACTIVE = 'ACTIVE';
const REQUESTS = 'REQUESTS';

class MeScreen extends React.Component<Props, State> {
  state = {
    activeTab: ACTIVE,
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

  handleSheetOpen = () => {};

  toggleManageSessions = () => this.setState({ showActiveSessions: !this.state.showActiveSessions });

  meSettingsItems = () => {
    return [
      {
        key: 'manageDetailsSessions',
        title: 'Manage details / Sessions',
        onPress: this.toggleManageSessions,
      },
    ];
  };

  renderSheetContent() {
    const { activeTab } = this.state;
    const { connectors, pending } = this.props;

    let title = '';
    let data = [];
    let empty = '';

    switch (activeTab) {
      case ACTIVE:
        title = 'sessions';
        data = connectors;
        empty = 'No Active Sessions';
        break;
      case REQUESTS:
        title = 'requests';
        data = pending;
        empty = 'No Pending Requests';
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        <Header title={title} />
        <ScrollWrapper>
          {!!data && data.length ? (
            data.map(({ session: { peerMeta } }) => {
              const uri = peerMeta.icons && peerMeta.icons.length ? peerMeta.icons[0] : '';
              return (
                <styled.SessionWrapper>
                  <ProfileImage
                    uri={uri}
                    userName={peerMeta.name}
                    borderWidth={4}
                    initialsSize={fontSizes.extraGiant}
                    diameter={172}
                    style={{ backgroundColor: baseColors.geyser }}
                  />
                </styled.SessionWrapper>
              );
            })
          ) : (
            <Center>
              <Text>{empty || 'Nothing here'}</Text>
            </Center>
          )}
        </ScrollWrapper>
      </React.Fragment>
    );
  }

  setActiveTab = activeTab => this.setState({ activeTab });

  render() {
    const { showActiveSessions, activeTab } = this.state;
    const { user } = this.props;

    const height = 330;
    const { width } = Dimensions.get('window');

    const sessionTabs = [
      {
        id: ACTIVE,
        name: 'Active',
        onPress: () => this.setActiveTab(ACTIVE),
      },
      {
        id: REQUESTS,
        name: 'Requests',
        onPress: () => this.setActiveTab(REQUESTS),
      },
    ];

    return (
      <ContainerWithBottomSheet
        inset={{ bottom: 0 }}
        color={baseColors.white}
        hideSheet={!showActiveSessions}
        bottomSheetProps={{
          forceOpen: false,
          sheetHeight: 240,
          swipeToCloseHeight: 62,
          onSheetOpen: this.handleSheetOpen,
          onSheetClose: this.toggleManageSessions,
          tabs: sessionTabs,
          activeTab,
          inverse: activeTab === ACTIVE,
        }}
        bottomSheetChildren={<styled.SheetContentWrapper>{this.renderSheetContent()}</styled.SheetContentWrapper>}
      >
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

                  <styled.NewSession>
                    <CircleButton label="New Session" icon={iconReceive} onPress={this.toggleQRScanner} />
                  </styled.NewSession>
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
      </ContainerWithBottomSheet>
    );
  }
}

const mapStateToProps = ({ user: { data: user }, walletConnect: { connectors, pending } }) => ({
  user,
  connectors,
  pending,
});

const mapDispatchToProps = dispatch => ({
  onWalletConnectSessionRequest: uri => dispatch(onWalletConnectSessionRequest(uri)),
  onWalletLinkScan: uri => dispatch(executeDeepLinkAction(uri)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
