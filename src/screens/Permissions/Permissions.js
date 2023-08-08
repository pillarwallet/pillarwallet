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
import React, { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import t from 'translations/translate';

// components
import { Paragraph, MediumText, BaseText } from 'components/legacy/Typography';
import Checkbox from 'components/legacy/Checkbox';
import Icon from 'components/legacy/Icon';
import CollapsibleListItem from 'components/legacy/ListItem/CollapsibleListItem';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { handleUrlPress } from 'utils/common';
import { getThemeColors, themedColors } from 'utils/themes';

// Selectors
import { useRootSelector } from 'selectors';

// constants
import { WELCOME, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

// types
import type { Theme } from 'models/Theme';
import Button from 'components/legacy/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
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

const FooterWrapper = styled.View`
  padding: ${spacing.layoutSides}px;
`;

const Permissions = ({ navigation, theme }: Props) => {
  const wallet = useRootSelector((root) => root.onboarding.wallet);

  const [openCollapseKey, setOpenCollapseKey] = useState(null);
  const [openInnerCollapseKey, setOpenInnerCollapseKey] = useState(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // keep sections in component scope due translations
  const sections = [
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

  const toggleCollapse = (key: string) => {
    setOpenCollapseKey(openCollapseKey === key ? null : key);
    setOpenInnerCollapseKey(null);
  };

  const toggleInnerCollapse = (key: string) => {
    setOpenInnerCollapseKey(openInnerCollapseKey === key ? null : key);
  };

  const handleAgree = () => {
    const username = navigation.getParam('username');
    navigation.navigate(wallet ? SET_WALLET_PIN_CODE : WELCOME, { username });
  };

  const colors = getThemeColors(theme);

  const renderSectionContent = ({ item: sectionContent }: Object) => {
    const { key, title, paragraph, custom } = sectionContent;
    if (paragraph) {
      return (
        <CollapsibleListItem
          customToggle={
            <InnerSectionToggle>
              <InnerSectionTitle>{title}</InnerSectionTitle>
            </InnerSectionToggle>
          }
          open={openInnerCollapseKey === key}
          onPress={() => toggleInnerCollapse(key)}
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
            <View
              style={{
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
          testID={`${TAG}-button-sub_permission_dropdown.${key}`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-sub_permission_dropdown.${key}`}
        />
      );
    }
    if (custom) {
      return <View style={{ marginHorizontal: 15 }}>{custom}</View>;
    }
    return (
      <SectionTitle key={key} style={{ margin: 30, fontSize: fontSizes.medium }}>
        {title}
      </SectionTitle>
    );
  };

  const renderCollapseContent = (sectionKey: string) => {
    const section = sections.find((thisSection) => thisSection.key === sectionKey) || {};
    const { content } = section;
    return <FlatList keyExtractor={(item) => item.key} data={content} renderItem={renderSectionContent} />;
  };

  const renderSection = ({ item: { title, key } }: Object) => (
    <CollapsibleListItem
      customToggle={
        <SectionToggle>
          <SectionTitle>{title}</SectionTitle>
          <IconHolder>
            <TickIcon name="check" />
          </IconHolder>
        </SectionToggle>
      }
      open={openCollapseKey === key}
      onPress={() => toggleCollapse(key)}
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
      collapseContent={renderCollapseContent(key)}
      noPadding
      testID={`${TAG}-button-permission_dropdown.${key}`}
      // eslint-disable-next-line i18next/no-literal-string
      accessibilityLabel={`${TAG}-button-permission_dropdown.${key}`}
    />
  );

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('auth:title.permissions') }] }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <StyledFlatList
          keyExtractor={(item) => item.key}
          data={sections}
          renderItem={renderSection}
          contentContainerStyle={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        />
        <FooterWrapper>
          <Checkbox
            onPress={() => setHasAgreedToTerms(!hasAgreedToTerms)}
            small
            lightText
            checked={hasAgreedToTerms}
            wrapperStyle={{ marginBottom: 16 }}
            testID={`${TAG}-checkbox-agree_to_terms`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-checkbox-agree_to_terms`}
          >
            {t('auth:withLink.readUnderstandAgreeTo', { linkedText: t('auth:termsOfUse') })}
          </Checkbox>
          <Button
            title={t('auth:button.proceed')}
            onPress={handleAgree}
            disabled={!hasAgreedToTerms}
            testID={`${TAG}-button-submit`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-submit`}
          />
        </FooterWrapper>
      </ScrollView>
    </ContainerWithHeader>
  );
};

export default withTheme(Permissions);

const TAG = 'Permissions';
