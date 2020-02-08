package com.pillarproject.wallet;

import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import io.intercom.android.sdk.push.IntercomPushClient;
import io.invertase.firebase.messaging.RNFirebaseMessagingService;

public class PillarFirebaseMessagingService extends RNFirebaseMessagingService {
    private final IntercomPushClient intercomPushClient = new IntercomPushClient();

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map message = remoteMessage.getData();
        if (intercomPushClient.isIntercomPush(message)) {
            intercomPushClient.handlePush(getApplication(), message);
        } else {
            super.onMessageReceived(remoteMessage);
        }
    }
}
