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
import { Container, ScrollWrapper } from 'components/Layout';
import { baseColors } from 'utils/variables';
import { Shadow } from 'components/Shadow';
import ProfileImage from 'components/ProfileImage/ProfileImage';
import QRCodeScanner from 'components/QRCodeScanner';
import CircleButton from 'components/CircleButton';
import SettingsListItem from 'components/ListItem/SettingsItem';
import { onWalletConnectSessionRequest } from 'actions/walletConnectActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import * as styled from './styles';

const iconReceive = require('assets/icons/icon_receive.png');

type State = {
  isScanning: boolean,
};

type Props = {
  user: Object,
  onWalletConnectCodeScan: (uri: string) => void,
  onWalletLinkScan: (uri: string) => void;
};

const meSettingsItems = () => {
  return [];
};

class MeScreen extends React.Component<Props, State> {
  state = {
    isScanning: false,
  };

  validateScannedQRCode = (uri: string) => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  toggleQRScanner = () => this.setState({ isScanning: !this.state.isScanning });

  handleQRScannerClose = () => this.setState({ isScanning: false });

  handleQRRead = (uri: string) => {
    const { onWalletConnectCodeScan, onWalletLinkScan } = this.props;

    this.handleQRScannerClose();

    if (uri.startsWith('wc:')) {
      onWalletConnectCodeScan(uri);
    } else {
      onWalletLinkScan(uri);
    }
  };

  render() {
    const { user } = this.props;

    const height = 330;
    const { width } = Dimensions.get('window');

    return (
      <Container>
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
            data={meSettingsItems()}
            renderItem={({ item: { key, title, onPress } }) => (
              <SettingsListItem key={key} label={title} onPress={onPress} />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </ScrollWrapper>
        <QRCodeScanner
          validator={this.validateScannedQRCode}
          isActive={this.state.isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({
  user,
});

const mapDispatchToProps = dispatch => ({
  onWalletConnectCodeScan: uri => dispatch(onWalletConnectSessionRequest(uri)),
  onWalletLinkScan: uri => dispatch(executeDeepLinkAction(uri)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
