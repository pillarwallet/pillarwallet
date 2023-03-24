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
import { Image as RNImage } from 'react-native';
import { SvgCssUri } from 'react-native-svg';

// Utils
import { isSvgImage } from 'utils/images';
import { isChainIcon, defaultTokensIcon } from 'utils/tokens';

// Components
import Image from 'components/Image';
import { NativeTokenIcon } from 'components/core/Icon';

// Type
import type { ImageProps } from 'components/Image';

type Props = ImageProps | SvgCssUri | any;

const CollectibleImage = (props: Props) => {
  const { uri }: any = props.source;

  if (isChainIcon(uri)) {
    const NativeIcon = NativeTokenIcon[uri];
    return <NativeIcon width={props.width || '100%'} height={props.height || '100%'} {...props} />;
  }

  if (isSvgImage(uri)) {
    return <SvgCssUri uri={uri} width={props.width || '100%'} height={props.height || '100%'} {...props} />;
  }

  const defaultTokenPath = defaultTokensIcon(uri);

  if (defaultTokenPath) {
    return (
      <RNImage
        {...props}
        source={defaultTokenPath}
        style={[{ width: props.width || '100%', height: props.height || '100%' }, props.style]}
      />
    );
  }

  return <Image {...props} style={[{ width: props.width || '100%', height: props.height || '100%' }, props.style]} />;
};

export default CollectibleImage;
