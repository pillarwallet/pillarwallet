// @flow

import React from 'react';
import { connect } from 'react-redux';

import { Container } from 'components/Layout';

const StorybookUIRoot = !process.env.TEST_MODE ? require('../../../storybook').default : null;

const StorybookUI = function () {
  const storybookUI = !StorybookUIRoot ? null : (
    <StorybookUIRoot
      style={{
        margin: '20px 0',
      }}
    />
  );

  return (
    <Container>
      {storybookUI}
    </Container>
  );
};

export default connect(null, null)(StorybookUI);
