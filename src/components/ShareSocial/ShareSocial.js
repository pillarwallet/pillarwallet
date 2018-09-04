// @flow
import * as React from 'react';
import styled from 'styled-components/native';

import { TouchableOpacity, TouchableNativeFeedback, Platform, Image } from 'react-native';
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
const instagram = require('assets/icons/icon_instagram.png');

type Props = {
  label?: string,
  facebook?: boolean,
  twitter?: boolean,
  instagram?: boolean,
}

export default class ShareSocial extends React.Component<Props> {
  shareOnTwitter = () => {};

  shareOnFacebook = () => {};

  shareOnInstagram = () => {};

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
      case instagram:
        return (
          <Image
            style={{
              width: 50,
              height: 50,
              resizeMode: 'contain',
            }}
            source={instagram}
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
          {!!instagram && this.renderKeys(this.shareOnInstagram, instagram)}
          {!!twitter && this.renderKeys(this.shareOnTwitter, twitter)}
        </ButtonsRow>
      </ShareWrapper>
    );
  }
}
