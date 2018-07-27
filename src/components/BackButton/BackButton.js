// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Icon from 'components/Icon';
import { UIColors, fontSizes } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const BackButton = (props: Props) => {
  const {
    navigation,
  } = props;
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{
        marginLeft: 10,
      }}
    >
      <Icon
        name="back"
        style={{
          color: UIColors.primary,
          fontSize: fontSizes.extraExtraLarge,
        }}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
