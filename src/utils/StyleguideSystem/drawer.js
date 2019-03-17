import React, { Component } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  AsyncStorage,
} from 'react-native';
import { DrawerItems } from 'react-navigation';
import capitalize from 'lodash.capitalize';
import forEach from 'lodash.foreach';
import map from 'lodash.map';
import groupBy from 'lodash.groupby';
import { STYLEGUIDE_SYSTEM } from 'constants/navigationConstants';
import * as styled from './styles';

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
    <styled.Parent key={`parent-item-${parentName}`}>
      <styled.ParentSection>
        <styled.ParentName
          key={`parent-name-${parentName}`}
          onPress={() => {
            console.log(parentName)
          }}
        >
          {capitalize(parentName)}
        </styled.ParentName>
      </styled.ParentSection>

      {map(parentGroup, (componentItem, groupName) => (
        <styled.Group key={`group-item-${groupName}`}>
          <styled.GroupSection>
            <styled.GroupName
              key={`group-name-${groupName}`}
              onPress={() => {
                console.log(groupName)
              }}
            >
              {groupName}
            </styled.GroupName>
          </styled.GroupSection>

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
        </styled.Group>
      ))}
    </styled.Parent>
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
