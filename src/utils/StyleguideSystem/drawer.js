import React, { Component } from 'react';
import {
  ScrollView,
  AsyncStorage,
} from 'react-native';
import styledComponent from 'styled-components/native';
import { DrawerItems } from 'react-navigation';
import capitalize from 'lodash.capitalize';
import forEach from 'lodash.foreach';
import map from 'lodash.map';
import groupBy from 'lodash.groupby';
import { STYLEGUIDE_SYSTEM } from 'constants/navigationConstants';
import { baseColors } from 'utils/variables';

import Section from './drawerParent';
import * as styled from './styles';

export const Group = styledComponent(Section)`
  background-color: red;
  width: 80%;
  margin: 0 0 8px 16px;
  border-left-width: 1px;
  border-left-color: ${baseColors.mediumGray};
`;

storeLastRoute = async (currentRoute) => {
  try {
    await AsyncStorage.setItem('LAST_ROUTE', currentRoute);
  } catch (error) {
    // Error saving data
  }
};

retrieveLastRoute = async (currentRoute, navigation) => {
  try {
    const value = await AsyncStorage.getItem('LAST_ROUTE');
    const lastRoute = value || STYLEGUIDE_SYSTEM;

    if (currentRoute !== lastRoute) {
      navigation.navigate({ routeName: lastRoute })
    }
  } catch (error) {
  }
};

function ItemComponent(props) {
  return (
    <styled.Item
      hasPadding={props.hasPadding}
      onPress={props.onPress}
    >
      <styled.ItemList
        isActive={props.isActive}
      >
        {props.title} {props.isActive ? '•' : ''}
      </styled.ItemList>
    </styled.Item>
  );
}

function ComponentsGroup(hierarchy, props) {
  const {
    activeItemKey: currentRoute
  } = props;

  return map(hierarchy, (parentGroup, parentName) => (
    <Section
      key={`parent-item-${parentName}`}
      shouldCollapse={parentName === 'COMPONENT'}
      title={capitalize(parentName)}
    >

      {map(parentGroup, (componentItem, groupName) => (
        <Section
          key={`group-item-${groupName}`}
          title={groupName}
          sectionColor={baseColors.mediumGray}
          sectionHeight={30}
          sectionFontSize={18}
          levelPosition={2}
        >
          {map(componentItem, ({ key, title, routeName }) => (
            <ItemComponent
              hasPadding
              key={`view-item-${key}`}
              isActive={currentRoute === key}
              title={title}
              onPress={() => {
                storeLastRoute(routeName);
                props.navigation.navigate({ routeName })
              }}
            />
          ))}
        </Section>
      ))}
    </Section>
  ));
}

class CustomDrawer extends Component {
  componentDidMount() {
    const { activeItemKey: currentRoute, navigation } = this.props;
    retrieveLastRoute(currentRoute, navigation);
  }

  render() {
    const {
      customItems,
      activeItemKey: currentRoute,
      navigation,
    } = this.props;

    const [Welcome, ...componentItems] = customItems;
    const hierarchy = groupBy(componentItems, 'parent');
    const groups = forEach(hierarchy, (group, parent) => {
      hierarchy[parent] = groupBy(group, 'group');
    });
    const isActive = currentRoute === Welcome.key;

    return (
      <ScrollView>
        <styled.SafeView
          forceInset={{ top: 'always', horizontal: 'never' }}
        >
          <ItemComponent
            isActive={currentRoute === Welcome.key}
            title={Welcome.title}
            onPress={() => {
              storeLastRoute(Welcome.routeName);
              navigation.navigate({ routeName: Welcome.routeName })
            }}
          />
          {ComponentsGroup(hierarchy, this.props)}
        </styled.SafeView>
      </ScrollView>
    );
  }
}

export default CustomDrawer;
