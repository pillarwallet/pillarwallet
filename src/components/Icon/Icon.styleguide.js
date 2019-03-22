import React from 'react';
import { View, Text } from 'react-native';
import map from 'lodash.map';
import { ScrollWrapper } from 'components/Layout';
import Styleguide from 'utils/StyleguideSystem/styleguide';
import { baseColors } from 'utils/variables';

import Icon, { glyphMap } from './Icon';

Styleguide.add({
  parent: 'COMPONENT',
  group: 'Icon',
  id: 'ICON_DEFAULT',
  title: 'List of Icons',
  component: (
    <ScrollWrapper>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 60,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
      }}>
        {map(glyphMap, (icon, name) => (
          <View
            key={`view-icon-${name}`}
            style={{
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              textAlign: 'center',
            }}
          >
            <Icon
              key={`icon-${name}`}
              name={name}
              style={{
                color: baseColors.mediumGray,
                fontSize: 20,
                textAlign: 'center',
              }}
            />
            <Text
              key={`icon-label-${name}`}
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
  ),
});
