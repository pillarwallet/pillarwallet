package com.pillarproject.wallet;

import android.content.Intent;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import io.intercom.android.sdk.push.IntercomPushClient;
import io.invertase.firebase.Utils;
import io.invertase.firebase.messaging.RNFirebaseBackgroundMessagingService;
import io.invertase.firebase.messaging.RNFirebaseMessagingService;

public class PillarFirebaseMessagingService extends RNFirebaseMessagingService {
    private static final String TAG = "PillarFirebaseMessaging";
    private final IntercomPushClient intercomPushClient = new IntercomPushClient();
    
    @Override public void onNewToken(String refreshedToken) {
        intercomPushClient.sendTokenToIntercom(getApplication(), refreshedToken);
    }


    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map message = remoteMessage.getData();
        if (intercomPushClient.isIntercomPush(message)) {
            Log.d(TAG, "onMessageReceived intercom message");
            intercomPushClient.handlePush(getApplication(), message);
        } else {
            super.onMessageReceived(remoteMessage);
        }
    }
}
