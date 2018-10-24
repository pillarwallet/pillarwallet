// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import Share from 'react-native-share';

import { TouchableOpacity, TouchableNativeFeedback, Platform, Image, Linking } from 'react-native';
import { Label } from 'components/Typography';

const ShareWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;

const ButtonsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ButtonWrapper = styled.View`
  padding: 14px;
`;

const facebook = require('assets/icons/icon_facebook.png');
const twitter = require('assets/icons/icon_twitter.png');

type Props = {
  label?: string,
  facebook?: boolean,
  twitter?: boolean,
  instagram?: boolean,
}

const SOCIAL_NETWORKS = [{
  platform: 'facebook',
  sharerUrl: 'https://www.facebook.com/sharer/sharer.php?u=https%3A//pillarproject.io/wallet',
  icon: facebook,
}, {
  platform: 'twitter',
  sharerUrl: 'https://twitter.com/intent/tweet?text=pillarproject.io/wallet',
  icon: twitter,
}];

export default class ShareSocial extends React.Component<Props> {
  shareOnSocialMedia = (platform: string, sharerUrl: string) => () => {
    Share.shareSingle({
      message: 'pillarproject.io/wallet',
      url: 'https://pillarproject.io/wallet',
      social: Share.Social[platform.toUpperCase()],
    })
      .catch(() => {
        Linking.openURL(sharerUrl);
      });
  };

  renderSharingButton() {
    return SOCIAL_NETWORKS.map(social => {
      if (Platform.OS === 'ios') {
        return (
          <TouchableOpacity
            key={social.platform}
            onPress={this.shareOnSocialMedia(social.platform, social.sharerUrl)}
          >
            <ButtonWrapper>
              <Image
                style={{
                  width: 30,
                  height: 30,
                }}
                resizeMode="contain"
                source={social.icon}
              />
            </ButtonWrapper>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableNativeFeedback
          key={social.platform}
          onPress={this.shareOnSocialMedia(social.platform, social.sharerUrl)}
          background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
        >
          <ButtonWrapper>
            <Image
              style={{
                width: 30,
                height: 30,
              }}
              resizeMode="contain"
              source={social.icon}
            />
          </ButtonWrapper>
        </TouchableNativeFeedback>
      );
    });
  }

  render() {
    const {
      label,
    } = this.props;

    return (
      <ShareWrapper>
        <Label>{label}</Label>
        <ButtonsRow>
          {this.renderSharingButton()}
        </ButtonsRow>
      </ShareWrapper>
    );
  }
}
