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
import { Container, ScrollWrapper } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native/index';
import Header from 'components/Header';
import { Paragraph, TextLink, BoldText } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import { fontSizes, spacing } from 'utils/variables';
import { handleUrlPress } from 'utils/common';
import ButtonText from 'components/ButtonText';
import { NEW_WALLET, IMPORT_WALLET } from 'constants/navigationConstants';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import { navigateToNewWalletPageAction } from 'actions/walletActions';


type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
};

type State = {
  openCollapseKey: string,
};

const SectionTitle = styled(BoldText)`
  font-size: ${fontSizes.medium}px;
  margin: 16px;
  margin-bottom: 10px;
`;

class Permissions extends React.Component<Props, State> {
  state = {
    openCollapseKey: '',
  };

  toggleCollapse = (key: string) => {
    const { openCollapseKey } = this.state;
    if (openCollapseKey === key) {
      this.setState({ openCollapseKey: '' });
    } else {
      this.setState({ openCollapseKey: key });
    }
  };

  handleAgree = () => {
    const { navigation, navigateToNewWalletPage } = this.props;
    const nextScreen = navigation.getParam('nextScreen', '');

    if (nextScreen === NEW_WALLET) {
      navigateToNewWalletPage();
    } else if (nextScreen === IMPORT_WALLET) {
      navigation.navigate(IMPORT_WALLET);
    }
    return null;
  };

  render() {
    const { openCollapseKey } = this.state;
    const { navigation } = this.props;

    return (
      <Container>
        <Header title="before we start" onBack={() => this.props.navigation.goBack(null)} />
        <ScrollWrapper>
          <Paragraph light small style={{ padding: spacing.mediumLarge }}>
            In order to work properly, Pillar Wallet requires your permission to collect, store and use certain
            information.
          </Paragraph>

          <SectionTitle>Required device access permissions:</SectionTitle>
          <CollapsibleListItem
            label="Internet Access, Phone and Network State"
            open={openCollapseKey === 'INTERNET'}
            onPress={() => this.toggleCollapse('INTERNET')}
            collapseContent={
              <React.Fragment>
                <Paragraph light small>
                  INTERNET - used for internet access since application can only run on device with active internet
                  connection.
                </Paragraph>
                <Paragraph light small>
                  ACCESS_NETWORK_STATE - used to check if current device has active internet connection.
                </Paragraph>
                <Paragraph light small>
                  READ_PHONE_STATE - used to check current cellular network information.
                </Paragraph>
                <Paragraph light small>
                  WAKE_LOCK - used to keep processor from sleeping to process background tasks.
                </Paragraph>
              </React.Fragment>
            }
          />
          <CollapsibleListItem
            label="Phone Storage"
            open={openCollapseKey === 'STORAGE_STATE'}
            onPress={() => this.toggleCollapse('STORAGE_STATE')}
            collapseContent={
              <React.Fragment>
                <Paragraph light small>
                  READ_INTERNAL_STORAGE and/or READ_EXTERNAL_STORAGE - allows an application to read from device storage
                  in order to show you your app data - settings, asset info and messages.
                </Paragraph>
                <Paragraph light small>
                  WRITE_EXTERNAL_STORAGE - allows an application to write to external storage in order to store your app
                  data - settings, asset info and messages.
                </Paragraph>
              </React.Fragment>
            }
          />
          <CollapsibleListItem
            label="Push notifications and alerts"
            open={openCollapseKey === 'PUSH_NOTIFICATIONS'}
            onPress={() => this.toggleCollapse('PUSH_NOTIFICATIONS')}
            collapseContent={
              <React.Fragment>
                <Paragraph light small>
                  C2D_MESSAGE - used to get device ID for remote &ldquo;Push Notifications&rdquo;.
                </Paragraph>
                <Paragraph light small>
                  RECEIVE - used for &ldquo;Push Notifications&rdquo; delivery.
                </Paragraph>
                <Paragraph light small>
                  SYSTEM_ALERT_WINDOW - used to show notifications on top of the app.
                </Paragraph>
              </React.Fragment>
            }
          />

          <SectionTitle>Required device feature permissions:</SectionTitle>
          <CollapsibleListItem
            label="Launcher Permissions"
            open={openCollapseKey === 'LAUNCHER'}
            onPress={() => this.toggleCollapse('LAUNCHER')}
            collapseContent={
              <React.Fragment>
                <Paragraph light small>
                  INSTALL_SHORTCUT / UPDATE_SHORTCUT - allows application to install / update shortcut in Launcher.
                </Paragraph>
                <Paragraph light small>
                  READ, WRITE, BROADCAST_BADGE, PROVIDER_INSERT_BADGE, UPDATE_COUNT, UPDATE_BADGE, CHANGE_BADGE,
                  READ_SETTINGS, WRITE_SETTINGS, READ_APP_BADGE, BADGE_COUNT_READ, BADGE_COUNT_WRITE -
                  badges related permissions (varies with the device) to manage notification badges.
                </Paragraph>
              </React.Fragment>
            }
          />
          <CollapsibleListItem
            label="Vibration"
            open={openCollapseKey === 'VIBRATION'}
            onPress={() => this.toggleCollapse('VIBRATION')}
            collapseContent={
              <Paragraph light small>
                VIBRATION - allows application to vibrate on QR code scan.
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="Camera"
            open={openCollapseKey === 'CAMERA'}
            onPress={() => this.toggleCollapse('CAMERA')}
            collapseContent={
              <Paragraph light small>
                CAMERA - allows application to open camera in order to scan QR codes or take profile picture.
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="Biometric Capture"
            open={openCollapseKey === 'BIOMETRICS'}
            onPress={() => this.toggleCollapse('BIOMETRICS')}
            collapseContent={
              <Paragraph light small>
                USE_FINGERPRINT - used to allow users to log in using fingerprint.
              </Paragraph>
            }
          />

          <SectionTitle>Data collected by the app:</SectionTitle>
          <CollapsibleListItem
            label="Debug data"
            open={openCollapseKey === 'DEBUG_DATA'}
            onPress={() => this.toggleCollapse('DEBUG_DATA')}
            collapseContent={
              <Paragraph light small>
                IP address, package and error info, username, public wallet address, device model and OS version
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="User provided data (optional)"
            open={openCollapseKey === 'USER_DATA'}
            onPress={() => this.toggleCollapse('USER_DATA')}
            collapseContent={
              <Paragraph light small>
                phone number for verification, full name, country of origin, profile picture
              </Paragraph>
            }
          />

          <SectionTitle>Data collected by third parties:</SectionTitle>
          <CollapsibleListItem
            label="Fabric"
            open={openCollapseKey === 'FABRIC'}
            onPress={() => this.toggleCollapse('FABRIC')}
            collapseContent={
              <Paragraph light small>
                used to track application issues and errors. More on their privacy policy –
                <TextLink onPress={() => handleUrlPress('https://docs.fabric.io/android/fabric/data-privacy.html')}> https://docs.fabric.io/android/fabric/data-privacy.html</TextLink>
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="Firebase"
            open={openCollapseKey === 'FIREBASE'}
            onPress={() => this.toggleCollapse('FIREBASE')}
            collapseContent={
              <Paragraph light small>
                used to track information regarding how you use the application.
                This includes what screens you open and what features you use, and it helps us
                improve the user experience, understand what are the more useful features.

                More on Google&rsquo;s privacy policy -
                <TextLink onPress={() => handleUrlPress('https://policies.google.com/privacy')}>
                  https://policies.google.com/privacy
                </TextLink>
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="Intercom"
            open={openCollapseKey === 'INTERCOM'}
            onPress={() => this.toggleCollapse('INTERCOM')}
            collapseContent={
              <Paragraph light small>
                used for application support. More on the privacy policy -
                <TextLink onPress={() => handleUrlPress('https://www.intercom.com/terms-and-policies#privacy')}> https://www.intercom.com/terms-and-policies#privacy</TextLink>
              </Paragraph>
            }
          />
          <CollapsibleListItem
            label="Sentry"
            open={openCollapseKey === 'SENTRY'}
            onPress={() => this.toggleCollapse('SENTRY')}
            collapseContent={
              <Paragraph light small>
                used for application error tracking – <TextLink onPress={() => handleUrlPress('https://sentry.io/privacy/')}>https://sentry.io/privacy/</TextLink>.
              </Paragraph>
            }
          />

          <Paragraph light small style={{ padding: spacing.mediumLarge }}>
            By pressing &ldquo;I agree&rdquo; button below, you agree to the described application usage policy and can
            proceed with creating your new Pillar user account. In order to receive a copy of your user data, request a
            removal and/or any other general inquiries, please email
            <TextLink onPress={() => handleUrlPress('mailto:dpo@pillarproject.io.')}> dpo@pillarproject.io.</TextLink>
          </Paragraph>

          <MultiButtonWrapper style={{ padding: 16 }}>
            <Button
              block
              title="I agree"
              onPress={this.handleAgree}
            />
            <ButtonText
              buttonText="Disagree"
              onPress={() => navigation.goBack()}
              fontSize={fontSizes.medium}
              wrapperStyle={{ marginTop: 20 }}
            />
          </MultiButtonWrapper>
        </ScrollWrapper>
      </Container>
    );
  }
}


const mapDispatchToProps = (dispatch: Function) => ({
  navigateToNewWalletPage: () => {
    dispatch(navigateToNewWalletPageAction());
  },
});

export default connect(null, mapDispatchToProps)(Permissions);
