// @flow

import React from 'react';
import { FlatList, Text } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';

import { fontSizes, fontWeights, spacing as letterSpacing } from '../variables';

const Container = styled(FlatList)`
  padding: 10px 15px;
`;

const TypographyView = styled.View`
  margin: 5px 0;
  padding: 10px 0 15px;
`;

const TypographyLabel = styled.View`
  flex-direction: row;
  margin-bottom: 5px;
`;

const Value = styled(Text)`
  color: #4c4c4c;
  font-size: 12px;
`;

const Title = styled(Value)`
  font-weight: bold;
  font-size: 14px;
`;

const TypographySample = styled(Text)`
  color: #383838;
  font-size: ${({ fontSize = 16 }) => fontSize};
  font-weight: ${({ fontWeight = 300 }) => fontWeight};
  letter-spacing: ${({ spacing = 0 }) => spacing};
`;

function setOfTypographyProps(typoProps: Object, propertyName: string) {
  return Object.keys(typoProps).map((title, index) => (
    {
      title,
      value: typoProps[title],
      key: `${title}-${index}-${typoProps[title]}`,
      propertyName,
    }
  ));
}

function typographyViewFor({ title, value, propertyName }) {
  const props = { [propertyName]: value };
  return (
    <TypographyView>
      <TypographyLabel>
        <Title>{title}:  </Title>
        <Value>{value}</Value>
      </TypographyLabel>
      <TypographySample
        {...props}
      >
        Lorem Ipsum
      </TypographySample>
    </TypographyView>
  );
}

storiesOf('Typography Properties', module)
  .add('font size', () => {
    return (
      <Container
        data={setOfTypographyProps(fontSizes, 'fontSize')}
        renderItem={({ item: typoProps }) => typographyViewFor(typoProps)}
      />
    );
  })
  .add('font weight', () => {
    return (
      <Container
        data={setOfTypographyProps(fontWeights, 'fontWeight')}
        renderItem={({ item: typoProps }) => typographyViewFor(typoProps)}
      />
    );
  })
  .add('spacing', () => {
    return (
      <Container
        data={setOfTypographyProps(letterSpacing, 'spacing')}
        renderItem={({ item: typoProps }) => typographyViewFor(typoProps)}
      />
    );
  });
