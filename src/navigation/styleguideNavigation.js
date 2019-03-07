import { createDrawerNavigator } from 'react-navigation';
import { STYLEGUIDE_SYSTEM } from 'constants/navigationConstants';
import { baseColors } from 'utils/variables';

import StyleguideSystemScreen from 'screens/StyleguideSystem';
import FirstScreen from 'screens/StyleguideSystem/FirstScreen';

const styleguideSystemFlow = createDrawerNavigator({
  [STYLEGUIDE_SYSTEM]: StyleguideSystemScreen,
  firstScreen: FirstScreen,
}, {
  drawerBackgroundColor: baseColors.mediumLightGray,
  contentOptions: {
    activeTintColor: baseColors.slateBlack,
    inactiveTintColor: baseColors.darkGray,
  }
});

export default styleguideSystemFlow;
