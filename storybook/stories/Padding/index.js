import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import style from './style';

const Padding = props => <View style={style.main}>{props.children}</View>;

Padding.propTypes = {
  children: PropTypes.node.isRequired,
};

export { Padding as default };
