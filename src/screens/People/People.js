// @flow
import * as React from 'react';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';

const People = () => {
  return (
    <Container>
      <Wrapper regularPadding>
        <Title title="people" />
        <ContactCard />
        <ContactCard />
        <ContactCard />
        <ContactCard />

      </Wrapper>
    </Container>
  );
};

export default People;
