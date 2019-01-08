// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';

type Props = {
  uri: string,
};

const defaultBadge = require('assets/images/defaultBadge.png');

const BadgeImage = ({ uri }: Props) => (
  <CachedImage
    key={uri}
    style={{
      height: 96,
      width: 96,
    }}
    source={{ uri }}
    resizeMode="contain"
    fallbackSource={defaultBadge}
  />
);

export default BadgeImage;
