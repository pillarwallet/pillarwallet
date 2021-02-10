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
import FastImage from 'react-native-fast-image';
import type { FastImageProps, FastImageSource } from 'react-native-fast-image';

export type ImageProps = FastImageProps;

const getValidSource = (source: FastImageSource | number) => {
  if (typeof source.uri !== 'string') return source;

  const { uri } = source;
  const isValidSource = uri.startsWith('https://') || uri.startsWith('http://');
  return isValidSource ? source : null;
};

// Note: this component should be FC, but is class because our version of Styled Components does not work with FCs.
// This can be refactored to FC as soon as we update Styled Componenents.

// eslint-disable-next-line react/prefer-stateless-function
class Image extends React.Component<ImageProps> {
  static resizeMode = FastImage.resizeMode;
  static priority = FastImage.priority;
  static cacheControl = FastImage.cacheControl;
  static preload = FastImage.preload;

  render() {
    const { source, ...rest } = this.props;
    return <FastImage source={getValidSource(source)} {...rest} />;
  }
}

export default Image;

