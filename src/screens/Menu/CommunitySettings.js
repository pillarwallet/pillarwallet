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
import { Linking } from 'react-native';
import * as Sentry from '@sentry/react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography/Typography';
import { ScrollWrapper } from 'components/Layout';
import TextInput from 'components/TextInput';
import Toast from 'components/Toast';
import { spacing } from 'utils/variables';
import { isValidEmail } from 'utils/validators';
import { reportLog } from 'utils/common';
import { subscribeToNewsletter } from 'services/newsletter';
import {
  TWITTER_SOCIAL_ADDRESS,
  TELEGRAM_SOCIAL_ADDRESS,
  YOUTUBE_SOCIAL_ADDRESS,
  MEDIUM_SOCIAL_ADDRESS,
  FACEBOOK_SOCIAL_ADDRESS,
} from 'constants/communityConstants';
import { SettingsSection } from './SettingsSection';


type State = {
  email: string,
  isSubmitted: boolean,
};

const NewsletterWrapper = styled.View`
  margin: 0 ${spacing.layoutSides}px;
  z-index: 10;
`;


class CommunitySettings extends React.Component<{}, State> {
  state = {
    email: '',
    isSubmitted: false,
  };

  goTo = (link: { web: string, app?: string}) => () => {
    if (!link.app) {
      Linking.openURL(link.web);
    } else {
      Linking.canOpenURL(link.app)
        .then(supported => supported ? Linking.openURL(link.app) : Linking.openURL(link.web))
        .catch(() => {});
    }
  };

  getSocialMediaItems = () => {
    return [
      {
        key: 'twitter',
        title: t('twitter'),
        onPress: this.goTo(TWITTER_SOCIAL_ADDRESS),
      },
      {
        key: 'telegram',
        title: t('telegram'),
        onPress: this.goTo(TELEGRAM_SOCIAL_ADDRESS),
      },
      {
        key: 'youtube',
        title: t('youtube'),
        onPress: this.goTo(YOUTUBE_SOCIAL_ADDRESS),
      },
      {
        key: 'medium',
        title: t('medium'),
        onPress: this.goTo(MEDIUM_SOCIAL_ADDRESS),
      },
      {
        key: 'facebook',
        title: t('facebook'),
        onPress: this.goTo(FACEBOOK_SOCIAL_ADDRESS),
      },
    ];
  };

  subscribe = () => {
    this.setState({ isSubmitted: true });
    if (!isValidEmail(this.state.email)) {
      return;
    }
    subscribeToNewsletter(this.state.email)
      .then(({ data }) => {
        if (data.result === 'success') {
          Toast.show({
            message: t('toast.subscribedToNewsletter'),
            emoji: 'ok_hand',
          });
        } else {
          Toast.show({
            message: t('toast.subscriptionToNewsletterFailed'),
            emoji: 'hushed',
            supportLink: true,
          });
          reportLog('Subscription to newsletter failed', { error: data.msg }, Sentry.Severity.Error);
        }
      })
      .catch(e => {
        Toast.show({
          message: t('toast.subscriptionToNewsletterFailed'),
          emoji: 'hushed',
          supportLink: true,
        });
        reportLog('Subscription to newsletter failed', { error: e }, Sentry.Severity.Error);
      });
  };

  render() {
    const { email, isSubmitted } = this.state;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('settingsContent.settingsItem.community.title') }] }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper
          contentContainerStyle={{ paddingVertical: spacing.mediumLarge }}
        >
          <NewsletterWrapper>
            <BaseText medium>{t('settingsContent.settingsItem.community.paragraph')}</BaseText>
            <TextInput
              inputProps={{
                value: email,
                onChange: value => this.setState({ email: value }),
                placeholder: t('form.subscription.placeholder'),
                autoCapitalize: 'none',
              }}
              inputWrapperStyle={{ marginTop: spacing.mediumLarge }}
              buttonProps={{
                title: t('button.subscribe'),
                small: true,
                regularText: true,
                marginRight: 12,
                height: 32,
                onPress: this.subscribe,
              }}
              errorMessage={isSubmitted && email && !isValidEmail(email) && t('error.invalid.email')}
            />
          </NewsletterWrapper>
          <SettingsSection
            sectionTitle={t('settingsContent.settingsItem.community.label.follow')}
            sectionItems={this.getSocialMediaItems()}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

export default CommunitySettings;

