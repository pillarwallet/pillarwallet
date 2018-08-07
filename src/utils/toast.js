// @flow
import { Toast } from 'native-base';
import { Platform } from 'react-native';
import { baseColors, UIColors, fontSizes } from 'utils/variables';

// Native Base has some styling I can't control, so this is a compromise
const horizontalMargin = Platform.OS === 'ios' ? 0 : 20;

function getTheme(type: string) {
  if (type === 'danger') {
    return ({
      backgroundColor: baseColors.fireEngineRed,
      textColor: baseColors.white,
    });
  } else if (type === 'info') {
    return ({
      backgroundColor: baseColors.electricBlue,
      textColor: baseColors.white,
    });
  }
  return ({
    backgroundColor: baseColors.snowWhite,
    textColor: UIColors.defaultTextColor,
  });
}

export const showToast = (info: Object) => {
  const theme = getTheme(info.type);

  Toast.show({
    text: info.text,
    buttonText: info.buttonText,
    position: info.position ? info.position : 'top',
    duration: info.duration !== undefined ? info.duration : 2000,
    textStyle: {
      color: theme.textColor,
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
      backgroundColor: theme.backgroundColor,
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
