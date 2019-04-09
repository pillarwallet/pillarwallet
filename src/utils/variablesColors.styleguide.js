import React from 'react';
import { View, Text } from 'react-native';
import map from 'lodash.map';
import { Container, ScrollWrapper } from 'components/Layout';
import { Styleguide } from 'StyleguideSystem';

import {
  baseColors,
  UIColors,
  brandColors,
} from './variables'

const colorContainer = (colorsToUse) => (
  <Container>
    <ScrollWrapper>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 60,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
      }}>
        {map(colorsToUse, (color, name) => (
          <View
            key={`view-color-${name}`}
            style={{
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              textAlign: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: color,
                width: 60,
                height: 60,
                marginBottom: 5,
              }}
            />
            <Text
              key={`color-label-${name}`}
              style={{
                color: baseColors.mediumGray,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>
    </ScrollWrapper>
  </Container>
);

Styleguide.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'BASE_COLORS',
  title: 'Base Colors',
  component: colorContainer(baseColors),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'UI_COLORS',
  title: 'UI Colors',
  component: colorContainer(UIColors),
});

Styleguide.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'BRAND_COLORS',
  title: 'Branch Colors',
  component: colorContainer(brandColors),
});
