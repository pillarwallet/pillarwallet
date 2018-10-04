// @flow
import { Alert } from 'react-native';
import { TYPE_REJECTED } from 'constants/invitationsConstants';

export function createAlert(alertType: string, alertData: Object, alertAction: Function) {
  if (alertType === TYPE_REJECTED) {
    return Alert.alert(
      'Are you sure?',
      `This will reject connection invitation from ${alertData.username}`,
      [
        { text: 'Cancel' },
        {
          text: 'Reject',
          onPress: () => alertAction(),
        },
      ],
    );
  }
  return null;
}

