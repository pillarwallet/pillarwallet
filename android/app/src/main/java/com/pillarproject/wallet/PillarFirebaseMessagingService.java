package com.pillarproject.wallet;
// TODO: implement handler with new PN lib as react-native-firebase v6 excluded notifications
//import com.google.firebase.messaging.RemoteMessage;
//
//import java.util.Map;
//
//import io.intercom.android.sdk.push.IntercomPushClient;
//import io.invertase.firebase.messaging.RNFirebaseMessagingService;
//
//public class PillarFirebaseMessagingService extends RNFirebaseMessagingService {
//    private final IntercomPushClient intercomPushClient = new IntercomPushClient();
//
//    @Override
//    public void onMessageReceived(RemoteMessage remoteMessage) {
//        Map message = remoteMessage.getData();
//        if (intercomPushClient.isIntercomPush(message)) {
//            intercomPushClient.handlePush(getApplication(), message);
//        } else {
//            super.onMessageReceived(remoteMessage);
//        }
//    }
//}
