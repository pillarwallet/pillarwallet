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
import Image from 'components/Image';

// Types
import type { ImageSource, ImageStyleProp } from 'utils/types/react-native';

type Props = {
  imageSource: ImageSource,
  fallbackWidth: number,
  fallbackHeight: number,
  style?: ImageStyleProp,
};

type State = {
  width: number,
  height: number,
};


class DynamicSizeImage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      width: props.fallbackWidth,
      height: props.fallbackHeight,
    };
  }

  componentDidMount() {
    this.getImageSize();
  }

  setImageSize = (width: number, height: number) => {
    this.setState({
      width: width / 3,
      height: height / 3,
    });
  };

  getImageSize = () => {
    const { imageSource } = this.props;

    if (!!imageSource && typeof imageSource === 'object' && imageSource.uri) {
      // $FlowFixMe: legacy code
      RNImage.getSize(imageSource.uri, (width, height) => {
        if (width && height) this.setImageSize(width, height);
      });
    } else {
      const { width, height } = RNImage.resolveAssetSource(imageSource) || {};
      if (width && height) this.setImageSize(width, height);
    }
  };

  render() {
    const { imageSource, style = {} } = this.props;
    const { width, height } = this.state;

    return (
      <Image
        source={imageSource}
        resizeMode="contain"
        style={[style, { width, height }]}
      />
    );
  }
}

export default DynamicSizeImage;
