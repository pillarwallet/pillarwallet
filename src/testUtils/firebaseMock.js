// @flow

export default class FirebaseMock {
  notifications = () => ({
    onNotification: (cb: Function) => {
      cb({}); // message
      return () => {
        return null;
      };
    },
  })

  messaging = () => ({
    requestPermission: () => Promise.resolve(),
    hasPermission: () => Promise.resolve(1),
  })
}
