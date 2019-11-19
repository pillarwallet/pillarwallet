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
import { FlatList, ScrollView, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

import { Paragraph, TextLink, MediumText, BaseText } from 'components/Typography';
import { baseColors, fontSizes, fontStyles, spacing } from 'utils/variables';
import { handleUrlPress } from 'utils/common';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import Checkbox from 'components/Checkbox';
import Icon from 'components/Icon';
import { NextFooter } from 'components/Layout/NextFooter';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  openCollapseKey: string,
  openInnerCollapseKey: string,
  hasAgreedToTerms: boolean,
};

const SectionToggle = styled.View`
  margin: 30px;
  flex-direction: row;
  align-items: center;
`;

const SectionTitle = styled(MediumText)`
  ${fontStyles.medium};
  margin-right: 12px;
  color: ${baseColors.text};
`;

const InnerSectionToggle = styled.View`
  margin: 30px;
  flex-direction: row;
  align-items: center;
`;

const InnerSectionTitle = styled(BaseText)`
  ${fontStyles.medium};
  color: ${baseColors.primary};
`;

const StyledFlatList = styled.FlatList`
  width: 100%;
  padding-bottom: 30px;
  flex: 1;
`;

const IconHolder = styled.View`
  height: 14px;
  width: 14px;
  border-radius: 7px;
  background-color: ${baseColors.positive};
  align-items: center;
  justify-content: center;
  margin-top: 4px;
`;

const TickIcon = styled(Icon)`
  font-size: 8px;
  color: ${baseColors.white};
  margin-top: 1px;
`;

const sections = [
  {
    key: 'ACCESS_PERMISSIONS',
    title: 'Access permissions',
    content: [
      {
        key: 'INTERNET',
        title: 'Internet Access, Phone and Network State',
        paragraphs: [
          'INTERNET - used for internet access since application can only run on device with active internet ' +
          'connection.',
          'ACCESS_NETWORK_STATE - used to check if current device has active internet connection.',
          'READ_PHONE_STATE - used to check current cellular network information.',
          'WAKE_LOCK - used to keep processor from sleeping to process background tasks.',
        ],
      },
      {
        key: 'STORAGE_STATE',
        title: 'Phone Storage',
        paragraphs: [
          'READ_INTERNAL_STORAGE and/or READ_EXTERNAL_STORAGE - allows an application to read from device' +
          'storage in order to show you your app data - settings, asset info and messages.',
          'WRITE_EXTERNAL_STORAGE - allows an application to write to external storage in order to store your' +
          'app data - settings, asset info and messages.',
        ],
      },
      {
        key: 'PUSH_NOTIFICATIONS',
        title: 'Push notifications and alerts',
        paragraphs: [
          'C2D_MESSAGE - used to get device ID for remote "Push Notifications"',
          'RECEIVE - used for "Push Notifications" delivery.',
          'SYSTEM_ALERT_WINDOW - used to show notifications on top of the app.',
        ],
      },
    ],
  },
  {
    key: 'FEATURE_PERMISSIONS',
    title: 'Feature permissions',
    content: [
      {
        key: 'LAUNCHER',
        title: 'Launcher Permissions',
        paragraphs: [
          'INSTALL_SHORTCUT / UPDATE_SHORTCUT - allows application to install / update shortcut in Launcher.',
          'READ, WRITE, BROADCAST_BADGE, PROVIDER_INSERT_BADGE, UPDATE_COUNT, UPDATE_BADGE, CHANGE_BADGE, ' +
          'READ_SETTINGS, WRITE_SETTINGS, READ_APP_BADGE, BADGE_COUNT_READ, BADGE_COUNT_WRITE - ' +
          'badges related permissions (varies with the device) to manage notification badges.',
        ],
      },
      {
        key: 'VIBRATION',
        title: 'Vibration',
        paragraphs: [
          'VIBRATION - allows application to vibrate on QR code scan.',
        ],
      },
      {
        key: 'CAMERA',
        title: 'Camera',
        paragraphs: [
          'CAMERA - allows application to open camera in order to scan QR codes or take profile picture.',
        ],
      },
      {
        key: 'BIOMETRICS',
        title: 'Biometric Capture',
        paragraphs: [
          'USE_FINGERPRINT - used to allow users to log in using fingerprint.',
        ],
      },
    ],
  },
  {
    key: 'COLLECTED_DATA',
    title: 'Collected data',
    content: [
      {
        key: 'DEBUG_DATA',
        title: 'Debug data',
        paragraphs: [
          'IP address, package and error info, username, public wallet address, device model and OS version.',
        ],
      },
      {
        key: 'USER_DATA',
        title: 'User provided data (optional)',
        paragraphs: [
          'phone number for verification, full name, country of origin, profile picture.',
        ],
      },
      {
        key: 'FABRIC',
        title: 'Fabric',
        paragraphs: (
          <Paragraph light small>
            used to track application issues and errors. More on their privacy policy –
            <TextLink onPress={() => handleUrlPress('https://docs.fabric.io/android/fabric/data-privacy.html')}> https://docs.fabric.io/android/fabric/data-privacy.html</TextLink>
          </Paragraph>
        ),
      },
      {
        key: 'INTERCOM',
        title: 'Intercom',
        paragraphs: (
          <Paragraph light small>
            used for application support. More on the privacy policy -
            <TextLink onPress={() => handleUrlPress('https://www.intercom.com/terms-and-policies#privacy')}> https://www.intercom.com/terms-and-policies#privacy</TextLink>
          </Paragraph>
        ),
      },
      {
        key: 'SENTRY',
        title: 'Sentry',
        paragraphs: (
          <Paragraph light small>
            used for application error tracking – <TextLink onPress={() => handleUrlPress('https://sentry.io/privacy/')}>https://sentry.io/privacy/</TextLink>.
          </Paragraph>
        ),
      },
      {
        key: 'DISCLAIMER',
        custom: (
          <Paragraph light small style={{ padding: spacing.mediumLarge }} key="disclaimer">
            In order to receive a copy of your user data, request a removal and/or any other general inquiries,
            please email
            <TextLink onPress={() => handleUrlPress('mailto:dpo@pillarproject.io.')}> dpo@pillarproject.io.</TextLink>
          </Paragraph>
        ),
      },
    ],
  },
];

class Permissions extends React.Component<Props, State> {
  state = {
    openCollapseKey: '',
    openInnerCollapseKey: '',
    hasAgreedToTerms: false,
  };

  toggleCollapse = (key: string) => {
    const { openCollapseKey } = this.state;
    if (openCollapseKey === key) {
      this.setState({ openCollapseKey: '', openInnerCollapseKey: '' });
    } else {
      this.setState({ openCollapseKey: key, openInnerCollapseKey: '' });
    }
  };

  toggleInnerCollapse = (key: string) => {
    const { openInnerCollapseKey } = this.state;
    if (openInnerCollapseKey === key) {
      this.setState({ openInnerCollapseKey: '' });
    } else {
      this.setState({ openInnerCollapseKey: key });
    }
  };

  handleAgree = () => {
    const { navigation } = this.props;
    navigation.navigate(SET_WALLET_PIN_CODE);
    return null;
  };

  renderSection = ({ item: section }: Object) => {
    const { openCollapseKey } = this.state;
    const { title, key } = section;
    return (
      <CollapsibleListItem
        customToggle={(
          <SectionToggle>
            <SectionTitle>{title}</SectionTitle>
            <IconHolder>
              <TickIcon name="check" />
            </IconHolder>
          </SectionToggle>
        )}
        open={openCollapseKey === key}
        onPress={() => this.toggleCollapse(key)}
        toggleWrapperStyle={{
          borderBottomColor: baseColors.border,
          borderBottomWidth: 0.5,
          borderTopColor: baseColors.border,
          borderTopWidth: 0.5,
          paddingRight: 15,
        }}
        wrapperStyle={{
          borderTopColor: baseColors.border,
          borderTopWidth: 0.5,
        }}
        collapseContent={this.renderCollapseContent(key)}
        noPadding
      />
    );
  };

  renderSectionContent = ({ item: sectionContent }: Object) => {
    const { openInnerCollapseKey } = this.state;
    const {
      key,
      title,
      paragraphs,
      custom,
    } = sectionContent;
    const collapseContent = Array.isArray(paragraphs)
      ? paragraphs.map((paragraph, index) => (<Paragraph light small key={`${key}-${index}`}>{paragraph}</Paragraph>))
      : paragraphs;
    if (paragraphs) {
      return (
        <CollapsibleListItem
          customToggle={(
            <InnerSectionToggle>
              <InnerSectionTitle>{title}</InnerSectionTitle>
            </InnerSectionToggle>
          )}
          open={openInnerCollapseKey === key}
          onPress={() => this.toggleInnerCollapse(key)}
          toggleWrapperStyle={{
            borderTopColor: baseColors.border,
            borderTopWidth: 0.5,
            paddingRight: 15,
          }}
          wrapperStyle={{
            borderBottomColor: baseColors.border,
            borderBottomWidth: 0.5,
          }}
          collapseContent={
            <View style={{
              flexDirection: 'column',
              flexWrap: 'wrap',
              flex: 1,
              marginRight: 30,
              marginLeft: -6,
            }}
            >
              {collapseContent}
            </View>
          }
        />
      );
    }
    if (custom) {
      return (
        <View style={{ marginHorizontal: 15 }}>
          {custom}
        </View>
      );
    }
    return (
      <SectionTitle key={key} style={{ margin: 30, fontSize: fontSizes.medium }}>{title}</SectionTitle>
    );
  };

  renderCollapseContent = (sectionKey: string) => {
    const section = sections.find((thisSection) => thisSection.key === sectionKey) || {};
    const { content } = section;
    return (
      <FlatList
        keyExtractor={item => item.key}
        data={content}
        extraData={this.state}
        renderItem={this.renderSectionContent}
      />
    );
  };

  render() {
    const { hasAgreedToTerms } = this.state;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Know how Pillar makes you safe' }] }}
        backgroundColor={baseColors.white}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingTop: '10%',
          }}
        >
          <StyledFlatList
            keyExtractor={item => item.key}
            data={sections}
            extraData={this.state}
            renderItem={this.renderSection}
            contentContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: baseColors.border,
            }}
          />
          <NextFooter
            onNextPress={this.handleAgree}
            nextDisabled={!hasAgreedToTerms}
            contentAlign="center"
          >
            <Checkbox
              onPress={() => { this.setState({ hasAgreedToTerms: !hasAgreedToTerms }); }}
              small
              lightText
            >
              I have read, understand, and agree to these Terms of Use
            </Checkbox>
          </NextFooter>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

export default Permissions;
