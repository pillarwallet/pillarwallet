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
import { Image } from 'react-native';
import { CachedImage } from 'react-native-cached-image';


type ImageSource = ?string | { [uri: string]: string };

type Props = {
  imageSource: ImageSource,
  fallbackWidth: number,
  fallbackHeight: number,
  style?: Object,
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

  getImageSize = () => {
    const { imageSource } = this.props;

    if (!!imageSource && typeof imageSource === 'object' && imageSource.uri) {
      Image.getSize(imageSource.uri, (width, height) => {
        if (width && height) {
          this.setState({
            width: width / 3,
            height: height / 3,
          });
        }
      });
    } else {
      const { width, height } = Image.resolveAssetSource(imageSource) || {};
      if (width && height) {
        this.setState({
          width: width / 3,
          height: height / 3,
        });
      }
    }
  };

  render() {
    const { imageSource, style = {} } = this.props;
    const { width, height } = this.state;

    return (
      <CachedImage
        source={imageSource}
        resizeMode="contain"
        style={{ ...style, width, height }}
      />
    );
  }
}

export default DynamicSizeImage;
