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
import styled, { withTheme } from 'styled-components/native/index';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import t from 'translations/translate';

import { Paragraph, MediumText, BaseText } from 'components/Typography';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { handleUrlPress } from 'utils/common';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import Checkbox from 'components/Checkbox';
import Icon from 'components/Icon';
import { NextFooter } from 'components/Layout/NextFooter';
import { getThemeColors, themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
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
  color: ${themedColors.text};
`;

const InnerSectionToggle = styled.View`
  padding: 30px;
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const InnerSectionTitle = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.primary};
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
  background-color: ${themedColors.positive};
  align-items: center;
  justify-content: center;
  margin-top: 4px;
`;

const TickIcon = styled(Icon)`
  font-size: 8px;
  color: ${themedColors.control};
  margin-top: 1px;
`;

class Permissions extends React.Component<Props, State> {
  state = {
    openCollapseKey: '',
    openInnerCollapseKey: '',
    hasAgreedToTerms: false,
  };

  sections = [
    {
      key: 'ACCESS_PERMISSIONS',
      title: t('auth:permissions.title.accessPermissions'),
      content: [
        {
          key: 'INTERNET',
          title: t('auth:permissions.title.internetPermissions'),
          paragraph: t('auth:permissions.paragraph.internetPermissions'),
        },
        {
          key: 'STORAGE_STATE',
          title: t('auth:permissions.title.storagePermissions'),
          paragraph: t('auth:permissions.paragraph.storagePermission'),
        },
        {
          key: 'PUSH_NOTIFICATIONS',
          title: t('auth:permissions.title.notificationPermissions'),
          paragraph: t('auth:permissions.paragraph.notificationPermissions'),
        },
      ],
    },
    {
      key: 'FEATURE_PERMISSIONS',
      title: t('auth:permissions.title.featurePermissions'),
      content: [
        {
          key: 'LAUNCHER',
          title: t('auth:permissions.title.launcherPermissions'),
          paragraph: t('auth:permissions.paragraph.launcherPermissions'),
        },
        {
          key: 'VIBRATION',
          title: t('auth:permissions.title.vibrationPermissions'),
          paragraph: t('auth:permissions.paragraph.vibrationPermissions'),
        },
        {
          key: 'CAMERA',
          title: t('auth:permissions.title.cameraPermissions'),
          paragraph: t('auth:permissions.paragraph.cameraPermissions'),
        },
        {
          key: 'BIOMETRICS',
          title: t('auth:permissions.title.biometricsPermissions'),
          paragraph: t('auth:permissions.paragraph.biometricsPermissions'),
        },
      ],
    },
    {
      key: 'COLLECTED_DATA',
      title: t('auth:permissions.title.collectedData'),
      content: [
        {
          key: 'DEBUG_DATA',
          title: t('auth:permissions.title.debugData'),
          paragraph: t('auth:permissions.paragraph.debugData'),
        },
        {
          key: 'USER_DATA',
          title: t('auth:permissions.title.userData'),
          paragraph: t('auth:permissions.paragraph.userData'),
        },
        {
          key: 'FIREBASE',
          title: t('auth:permissions.title.firebase'),
          paragraph: t('auth:permissions.withLink.firebase', {
            linkedText: 'https://firebase.google.com/policies/analytics',
            onPress: () => handleUrlPress('https://firebase.google.com/policies/analytics'),
          }),
        },
        {
          key: 'INTERCOM',
          title: t('auth:permissions.title.intercom'),
          paragraph: t('auth:permissions.withLink.intercom', {
            linkedText: 'https://www.intercom.com/terms-and-policies#privacy',
            onPress: () => handleUrlPress('https://www.intercom.com/terms-and-policies#privacy'),
          }),
        },
        {
          key: 'SENTRY',
          title: t('auth:permissions.title.sentry'),
          paragraph: t('auth:permissions.withLink.sentry', {
            linkedText: 'https://sentry.io/privacy/',
            onPress: () => handleUrlPress('https://sentry.io/privacy/'),
          }),
        },
        {
          key: 'DISCLAIMER',
          custom: (
            <Paragraph light small style={{ padding: spacing.mediumLarge }} key="disclaimer">
              {t('auth:permissions.withLink.disclaimer', {
                linkedText: 'dpo@pillarproject.io',
                onPress: () => handleUrlPress('mailto:dpo@pillarproject.io.'),
              })}
            </Paragraph>
          ),
        },
      ],
    },
  ];

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
    const username = navigation.getParam('username');
    navigation.navigate(SET_WALLET_PIN_CODE, { username });
    return null;
  };

  renderSection = ({ item: section }: Object) => {
    const { theme } = this.props;
    const { openCollapseKey } = this.state;
    const { title, key } = section;
    const colors = getThemeColors(theme);

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
          borderBottomColor: colors.border,
          borderBottomWidth: 0.5,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingRight: 15,
        }}
        wrapperStyle={{
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        }}
        collapseContent={this.renderCollapseContent(key)}
        noPadding
      />
    );
  };

  renderSectionContent = ({ item: sectionContent }: Object) => {
    const { openInnerCollapseKey } = this.state;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    const {
      key,
      title,
      paragraph,
      custom,
    } = sectionContent;
    if (paragraph) {
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
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            paddingRight: 15,
          }}
          wrapperStyle={{
            borderBottomColor: colors.border,
            borderBottomWidth: 0.5,
          }}
          collapseContent={
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              flex: 1,
              marginRight: 30,
              marginLeft: -6,
            }}
            >
              <Paragraph light small>
                {paragraph}
              </Paragraph>
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
    const section = this.sections.find((thisSection) => thisSection.key === sectionKey) || {};
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
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('auth:title.permissions') }] }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
          }}
        >
          <StyledFlatList
            keyExtractor={item => item.key}
            data={this.sections}
            extraData={this.state}
            renderItem={this.renderSection}
            contentContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
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
              checked={hasAgreedToTerms}
            >
              {t('auth:withLink.readUnderstandAgreeTo', { linkedText: t('auth:termsOfUse') })}
            </Checkbox>
          </NextFooter>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

export default withTheme(Permissions);
