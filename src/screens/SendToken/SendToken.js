// @flow
import * as React from 'react';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';

export default class SendToken extends React.Component<{}> {
  getImagePath(symbol: string) {
    return `assets/images/${symbol}/icon.png`;
  }
  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title title="send" />
        </Wrapper>
      </Container>
    );
  }
}
