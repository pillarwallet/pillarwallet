// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import Share from 'react-native-share';

import { TouchableOpacity, TouchableNativeFeedback, Platform, Image, Linking } from 'react-native';
import { Label } from 'components/Typography';
import { spacing } from 'utils/variables';


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
  padding: ${spacing.rhythm / 2}px 4px;
`;

const facebook = require('assets/icons/icon_facebook.png');
const twitter = require('assets/icons/icon_twitter.png');

type Props = {
  label?: string,
  facebook?: boolean,
  twitter?: boolean,
  instagram?: boolean,
}

export default class ShareSocial extends React.Component<Props> {
  shareOnTwitter = () => {
    Share.shareSingle({
      title: 'Pillar Wallet',
      message: 'pillarproject.io/wallet',
      url: 'https://pillarproject.io/wallet',
      social: Share.Social.TWITTER,
    })
      .catch(() => {
        Linking.openURL('https://twitter.com/intent/tweet?text=pillarproject.io/wallet');
      });
  };

  shareOnFacebook = () => {
    Share.shareSingle({
      message: 'pillarproject.io/wallet',
      url: 'https://pillarproject.io/wallet',
      social: Share.Social.FACEBOOK,
    })
      .catch(() => {
        Linking.openURL('https://www.facebook.com/sharer/sharer.php?u=https%3A//pillarproject.io/wallet');
      });
  };

  renderSocialButton(platform: string) {
    switch (platform) {
      case facebook:
        return (
          <Image
            style={{
              width: 50,
              height: 50,
              resizeMode: 'contain',
            }}
            source={facebook}
          />
        );
      case twitter:
        return (
          <Image
            style={{
              width: 50,
              height: 50,
              resizeMode: 'contain',
            }}
            source={twitter}
          />
        );
      default:
        return null;
    }
  }

  renderKeys(onPress: Function, platform: string) {
    if (Platform.OS === 'ios') {
      return (
        <TouchableOpacity onPress={onPress}>
          <ButtonWrapper>
            {this.renderSocialButton(platform)}
          </ButtonWrapper>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableNativeFeedback
        onPress={onPress}
        background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
      >
        <ButtonWrapper>
          {this.renderSocialButton(platform)}
        </ButtonWrapper>
      </TouchableNativeFeedback>
    );
  }

  render() {
    const {
      label,
    } = this.props;

    return (
      <ShareWrapper>
        <Label>{label}</Label>
        <ButtonsRow>
          {!!facebook && this.renderKeys(this.shareOnFacebook, facebook)}
          {!!twitter && this.renderKeys(this.shareOnTwitter, twitter)}
        </ButtonsRow>
      </ShareWrapper>
    );
  }
}
