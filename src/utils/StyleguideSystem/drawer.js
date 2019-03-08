import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { DrawerItems } from 'react-navigation';
import map from 'lodash.map';
import groupBy from 'lodash.groupby';
import * as styled from './styles';

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

function ComponentsGroup(groups, props) {
  const {
    activeItemKey: currentRoute
  } = props;

  return map(groups, (componentItem, groupName) => (
    <styled.Group key={`group-item-${groupName}`}>
      <styled.GroupSection>
        <styled.GroupName
          key={`group-item-${groupName}`}
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
          onPress={() => props.navigation.navigate({ routeName })}
        />
      ))}
    </styled.Group>
  ));
}

const CustomDrawer = (props) => {
  const {
    customItems,
    activeItemKey: currentRoute
  } = props;
  const [Welcome, ...componentItems] = customItems;
  const groups = groupBy(componentItems, 'group');
  const isActive = currentRoute === Welcome.key;

  return (
    <ScrollView>
      <styled.SafeView
        forceInset={{ top: 'always', horizontal: 'never' }}
      >
        <ItemComponent
          isActive={currentRoute === Welcome.key}
          title={Welcome.title}
          onPress={() => props.navigation.navigate({
            routeName: Welcome.routeName,
          })}
        />
        {ComponentsGroup(groups, props)}
      </styled.SafeView>
    </ScrollView>
  );
};

export default CustomDrawer;
