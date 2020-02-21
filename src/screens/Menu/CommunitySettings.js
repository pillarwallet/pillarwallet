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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography/Typography';
import { ScrollWrapper } from 'components/Layout';
import TextInput from 'components/TextInput';
import Toast from 'components/Toast';
import { spacing } from 'utils/variables';
import { isValidEmail } from 'utils/validators';
import { subscribeToNewsletter } from 'services/newsletter';
import {
  TWITTER_SOCIAL_ADDRESS,
  TELEGRAM_SOCIAL_ADDRESS,
  YOUTUBE_SOCIAL_ADDRESS,
  MEDIUM_SOCIAL_ADDRESS,
  FACEBOOK_SOCIAL_ADDRESS,
  FORUM_SOCIAL_ADDRESS,
} from 'constants/communityConstants';
import { SettingsSection } from './SettingsSection';

type Props = {

};

type State = {
  email: string,
  isSubmitted: boolean,
};

class CommunitySettings extends React.Component<Props, State> {
  state = {
    email: '',
    isSubmitted: false,
  }

  goTo = (link: { web: string, app?: string}) => () => {
    if (!link.app) {
      Linking.openURL(link.web);
    } else {
      Linking.canOpenURL(link.app)
        .then(supported => supported ? Linking.openURL(link.app) : Linking.openURL(link.web))
        .catch();
    }
  }

  getSocialMediaItems = () => {
    return [
      {
        key: 'twitter',
        title: 'Twitter',
        onPress: this.goTo(TWITTER_SOCIAL_ADDRESS),
      },
      {
        key: 'telegram',
        title: 'Telegram',
        onPress: this.goTo(TELEGRAM_SOCIAL_ADDRESS),
      },
      {
        key: 'youtube',
        title: 'Youtube',
        onPress: this.goTo(YOUTUBE_SOCIAL_ADDRESS),
      },
      {
        key: 'medium',
        title: 'Medium',
        onPress: this.goTo(MEDIUM_SOCIAL_ADDRESS),
      },
      {
        key: 'facebook',
        title: 'Facebook',
        onPress: this.goTo(FACEBOOK_SOCIAL_ADDRESS),
      },
      {
        key: 'forum',
        title: 'Forum',
        onPress: this.goTo(FORUM_SOCIAL_ADDRESS),
      },
    ];
  }

  subscribe = () => {
    this.setState({ isSubmitted: true });
    if (!isValidEmail(this.state.email)) {
      return;
    }
    subscribeToNewsletter(this.state.email)
      .then(({ data }) => {
        if (data.result === 'success') {
          Toast.show({
            title: 'Subscribed!',
            type: 'success',
            message: 'Subscribed to the newsletter successfully.',
          });
        } else {
          Toast.show({
            title: 'Subscription failed',
            type: 'warning',
            message: data.msg || 'Failed to subscribe to the newsletter',
          });
        }
      })
      .catch(e => {
        Toast.show({
          title: 'Subscription failed',
          type: 'warning',
          message: e.toString() || 'Failed to subscribe to the newsletter',
        });
      });
  }

  render() {
    const { email, isSubmitted } = this.state;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Community' }] }}
      >
        <ScrollWrapper
          contentContainerStyle={{ paddingHorizontal: spacing.layoutSides, paddingVertical: spacing.mediumLarge }}
        >
          <BaseText medium>
            Join Pillar community, subscribe to our newsletter to receive latest news, updates and more
          </BaseText>
          <TextInput
            inputProps={{
              value: email,
              onChange: value => this.setState({ email: value }),
              placeholder: 'Your e-mail',
              autoCapitalize: 'none',
            }}
            inputWrapperStyle={{ marginTop: spacing.mediumLarge }}
            buttonProps={{
              title: 'Subscribe',
              small: true,
              regularText: true,
              marginRight: 12,
              height: 32,
              onPress: this.subscribe,
            }}
            errorMessage={isSubmitted && email && !isValidEmail(email) && 'Please enter a valid email'}
          />
          <SettingsSection
            sectionTitle="Follow us"
            sectionItems={this.getSocialMediaItems()}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

export default CommunitySettings;

