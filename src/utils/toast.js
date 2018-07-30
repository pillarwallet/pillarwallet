// @flow
import { Toast } from 'native-base';
import { Platform } from 'react-native';
import { baseColors, UIColors, fontSizes } from 'utils/variables';

// Native Base has some styling I can't control, so this is a compromise
const horizontalMargin = Platform.OS === 'ios' ? 0 : 20;
export const showToast = (info: Object) => {
  Toast.show({
    text: info.text,
    buttonText: info.buttonText,
    position: 'top',
    duration: 2000,
    textStyle: {
      color: info.type === 'danger' ? baseColors.white : UIColors.defaultTextColor,
      fontFamily: 'aktiv-grotesk-regular',
      fontSize: fontSizes.small,
    },
    buttonStyle: {
      marginLeft: 20,
      backgroundColor: baseColors.snowWhite,
    },
    buttonTextStyle: {
      color: UIColors.defaultTextColor,
      fontFamily: 'aktiv-grotesk-regular',
      fontSize: fontSizes.small,
    },
    style: {
      backgroundColor: info.type === 'danger' ? baseColors.fireEngineRed : baseColors.snowWhite,
      height: 80,
      borderRadius: 4,
      marginTop: 20,
      marginLeft: horizontalMargin,
      marginRight: horizontalMargin,
      justifyContent: 'center',
      borderColor: UIColors.defaultBorderColor,
      borderWidth: 1,
    },

  });
};
