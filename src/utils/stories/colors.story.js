// @flow

import React from 'react';
import { FlatList, Text } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';

import { baseColors, brandColors, UIColors } from '../variables';

const Container = styled(FlatList)`
  padding: 10px 15px;
`;

const ColorView = styled.View`
  margin: 10px 0;
`;

const Square = styled.View`
  background-color: ${({ color }) => color};
  height: 40;
`;

const ColorLabel = styled.View`
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

function setOfColors(colors: Object): Array<Object> {
  return Object.keys(colors).map((color, index) => (
    { title: color, value: colors[color], key: `${color}-${index}-${colors[color]}` }
  ));
}

function setOfBrandColors(): Array<Object> {
  return brandColors.map((color, index) => (
    { title: color, value: color, key: `${color}-${index}` }
  ));
}

function colorviewFor({ title, value }) {
  return (
    <ColorView>
      <ColorLabel>
        <Title>{title}:  </Title>
        <Value>{value}</Value>
      </ColorLabel>
      <Square
        color={value}
      />
    </ColorView>
  );
}

storiesOf('Colors Palette', module)
  .add('baseColors', () => {
    return (
      <Container
        data={setOfColors(baseColors)}
        renderItem={({ item: color }) => colorviewFor(color)}
      />
    );
  })
  .add('brandColors', () => {
    return (
      <Container
        data={setOfBrandColors()}
        renderItem={({ item: color }) => colorviewFor(color)}
      />
    );
  })
  .add('UIColors', () => {
    return (
      <Container
        data={setOfColors(UIColors)}
        renderItem={({ item: color }) => colorviewFor(color)}
      />
    );
  });
