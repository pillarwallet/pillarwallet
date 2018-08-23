// @flow

class FirebaseMock {
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
    getToken: () => Promise.resolve('12x2342x212'),
  })

  crashlytics = () => ({
    setUserIdentifier: () => {},
  })
}

export default new FirebaseMock();
