// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';
import FastImage from 'react-native-fast-image';
import type { Badge } from 'models/Badge';

type Props = {
  data: Badge,
  size?: number,
};

const defaultBadge = require('assets/images/defaultBadge.png');

const BadgeImage = ({ data: badge, size = 96 }: Props) => {
  size = parseInt(size, 10);
  const badgeUri = badge.imageUrl ? `${badge.imageUrl}?t=${badge.updatedAt || 0}` : '';
  return (
    <FastImage
      ref={img => { this.img = img; }}
      style={{
              height: size,
              width: size,
          }}
      source={{
              uri: badgeUri,
              priority: FastImage.priority.normal,
          }}
      resizeMode={FastImage.resizeMode.contain}
      onError={() => { this.img.source = defaultBadge; }}
    />
  );
};

export default BadgeImage;
