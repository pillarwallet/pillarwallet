// @flow

import React from 'react';
import { connect } from 'react-redux';

import { Container } from 'components/Layout';
import { PIN_CODE_UNLOCK } from 'constants/navigationConstants';

const StorybookUIRoot = !process.env.TEST_MODE ? require('../../../storybook').default : null;

type Props = {};

class StorybookUI extends React.Component<Props> {
  render() {
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
  }
}

export default connect(null, null)(StorybookUI);
