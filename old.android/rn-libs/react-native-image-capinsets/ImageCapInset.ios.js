import React, { Component } from 'react';
import {
  ImageBackground,
  Image,
} from 'react-native';

class ImageCapInset extends Component {
  render() {
    return (
      <ImageBackground
        {...this.props}
        resizeMode="stretch"
      />
    );
  }
}

export default ImageCapInset;
