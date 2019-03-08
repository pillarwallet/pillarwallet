import React, { Component } from 'react';

const components = [];

const Styleguide = {

  add: (config) => {
    const { id, group, title } = config;
    components.push({ id, group, title, component: guideSystem(config) });
  },

  uiComponents: () => {
    return components;
  },
}

function guideSystem (config) {
  const { title, component } = config;

  return class StyleguideSystem extends Component {
    static navigationOptions = {
      drawerLabel: title,
    };

    render() {
      return component;
    }
  }
};

export default Styleguide;
