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
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import { spacing, fontSizes } from 'utils/variables';
import { approveSessionAction, rejectSessionAction } from 'actions/walletConnectActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  approveSession: Function,
  rejectSession: Function,
};

const FooterWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const OptionButton = styled(Button)`
  margin-top: 14px;
  flex-grow: 1;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class WalletConnectSessionRequestScreen extends React.Component<Props> {
  handleSessionApproval = () => {
    const { navigation, approveSession } = this.props;
    const peerId = navigation.getParam('peerId', {});
    Keyboard.dismiss();
    approveSession(peerId);
    navigation.goBack(null);
  };

  handleSessionRejection = () => {
    const { navigation, rejectSession } = this.props;
    const peerId = navigation.getParam('peerId', {});
    Keyboard.dismiss();
    rejectSession(peerId);
    navigation.goBack(null);
  };

  render() {
    const { navigation } = this.props;
    const {
      description,
      url,
      icons,
      name,
    } = navigation.getParam('peerMeta', {});

    const icon = icons && icons.length ? icons[0] : null;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Wallet Connect' }],
          customOnBack: this.handleSessionRejection,
        }}
      >
        <ScrollWrapper regularPadding>
          <Title subtitle title="WalletConnect Request" />
          {!!icon && (
            <CachedImage
              key={name}
              style={{
                height: 55,
                width: 55,
                marginBottom: spacing.mediumLarge,
              }}
              source={{ uri: icon }}
              fallbackSource={genericToken}
              resizeMode="contain"
            />
          )}
          <LabeledRow>
            <Label>Name</Label>
            <Value>{name || 'Unknown'}</Value>
          </LabeledRow>
          {!!description && (
            <LabeledRow>
              <Label>Description</Label>
              <Value>{description}</Value>
            </LabeledRow>
          )}
          {!!url && (
            <LabeledRow>
              <Label>Url</Label>
              <Value>{url}</Value>
            </LabeledRow>
          )}
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <OptionButton
              primaryInverted
              onPress={this.handleSessionApproval}
              regularText
              title="Approve"
            />
            <OptionButton
              dangerInverted
              onPress={this.handleSessionRejection}
              regularText
              title="Reject"
            />
          </FooterWrapper>
        </Footer>
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  approveSession: peerId => dispatch(approveSessionAction(peerId)),
  rejectSession: peerId => dispatch(rejectSessionAction(peerId)),
});

export default connect(
  null,
  mapDispatchToProps,
)(WalletConnectSessionRequestScreen);
