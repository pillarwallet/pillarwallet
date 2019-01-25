// @flow

import React from 'react';
import { connect } from 'react-redux';

import Header from 'components/Header';
import { Container } from 'components/Layout';
import { PIN_CODE_UNLOCK } from 'constants/navigationConstants';

const StorybookUIRoot = !process.env.TEST_MODE ? require('../../../storybook').default : null;

type Props = {
  navigation: Object
};

class StorybookUI extends React.Component<Props> {
  handleBackAction = () => {
    const { navigation } = this.props;
    navigation.navigate(PIN_CODE_UNLOCK);
  };

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
        <Header
          onBack={this.handleBackAction}
          title="storybook"
        />
        {storybookUI}
      </Container>
    );
  }
}

export default connect(null, null)(StorybookUI);
