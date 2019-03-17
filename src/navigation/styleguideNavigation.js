import { createDrawerNavigator } from 'react-navigation';
import { STYLEGUIDE_SYSTEM } from 'constants/navigationConstants';
import { baseColors } from 'utils/variables';

import Welcome from 'utils/StyleguideSystem';
import CustomDrawer from 'utils/StyleguideSystem/drawer';
import Styleguide from 'utils/StyleguideSystem/styleguide';

const components = Styleguide.uiComponents();

function styleGuides() {
  const uiComponents = {};

  components.forEach(({ id, component }) => {
    uiComponents[id] = component;
  });

  return uiComponents;
}

function drawerItems() {
  return components.map(({ id, group = 'UNGROUPED', title, parent = 'NOPARENT' }) => (
    {
      key: id,
      routeName: id,
      group,
      title,
      parent,
    }
  ));
}

const styleguideSystemFlow = createDrawerNavigator({
  [STYLEGUIDE_SYSTEM]: Welcome,
  ...styleGuides(),
}, {
  drawerBackgroundColor: baseColors.mediumLightGray,
  contentComponent: CustomDrawer,
  contentOptions: {
    customItems: [
      {
        key: STYLEGUIDE_SYSTEM,
        routeName: STYLEGUIDE_SYSTEM,
        title: 'Welcome to Styleguide',
      },
      ...drawerItems(),
    ],
  },
});

export default styleguideSystemFlow;
