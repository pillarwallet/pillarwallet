// @flow

import React from 'react';
import { View, Text } from 'react-native';
import map from 'lodash.map';
import { Container, ScrollWrapper } from 'components/Layout';
import { Hobbes } from 'HobbesUI';

import {
  baseColors,
  fontSizes,
  spacing,
  fontWeights,
} from './variables';

Hobbes.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'FONT_SIZES',
  title: 'Font Sizes',
  component: (
    <Container>
      <ScrollWrapper>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 10,
            marginBottom: 10,
            marginLeft: 20,
            marginRight: 20,
          }}
        >
          {map(fontSizes, (fontSize, name) => (
            <View
              key={`view-fontVar-${name}`}
              style={{
                marginTop: 20,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                key={`fontVar-label-${name}`}
                style={{
                  color: baseColors.mediumGray,
                  fontSize,
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
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'FONT_SPACING',
  title: 'Font Spacing',
  component: (
    <Container>
      <ScrollWrapper>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 10,
            marginBottom: 10,
            marginLeft: 20,
            marginRight: 20,
          }}
        >
          {map(spacing, (fontSpacing, name) => (
            <View
              key={`view-fontVar-${name}`}
              style={{
                marginTop: 20,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                key={`fontVar-label-${name}`}
                style={{
                  color: baseColors.mediumGray,
                  fontSize: 14,
                  letterSpacing: fontSpacing,
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
  ),
});

Hobbes.add({
  parent: 'COMPONENT',
  group: 'VARIABLES',
  id: 'FONT_WEIGHTS',
  title: 'Font Weights',
  component: (
    <Container>
      <ScrollWrapper>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 10,
            marginBottom: 10,
            marginLeft: 20,
            marginRight: 20,
          }}
        >
          {map(fontWeights, (fontWeight, name) => (
            <View
              key={`view-fontVar-${name}`}
              style={{
                marginTop: 20,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                key={`fontVar-label-${name}`}
                style={{
                  color: baseColors.mediumGray,
                  fontSize: 14,
                  fontWeight,
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
  ),
});
