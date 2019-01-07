// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';

type Props = {
  uri: string,
};

const BadgeImage = ({ uri }: Props) => (
  <CachedImage
    key={uri}
    style={{
      height: 96,
      width: 96,
    }}
    source={{ uri }}
    resizeMode="contain"
  />
);

export default BadgeImage;
