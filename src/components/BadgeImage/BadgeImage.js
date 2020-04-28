// @flow
import * as React from 'react';
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
      style={{
              height: size,
              width: size,
          }}
      source={{
              uri: badgeUri,
              priority: FastImage.priority.normal,
          }}
      resizeMode={FastImage.resizeMode.contain}
      fallback
      defaultSource={defaultBadge}
    />
  );
};

export default BadgeImage;
