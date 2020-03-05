package com.pillarproject.wallet;

import android.annotation.SuppressLint;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.wix.reactnativenotifications.fcm.FcmInstanceIdListenerService;

import java.util.Map;

import io.intercom.android.sdk.push.IntercomPushClient;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class PillarFirebaseMessagingService extends FcmInstanceIdListenerService {
    private final IntercomPushClient intercomPushClient = new IntercomPushClient();

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d("onMessageReceived: ", remoteMessage.toString());
        Map message = remoteMessage.getData();
        if (intercomPushClient.isIntercomPush(message)) {
            intercomPushClient.handlePush(getApplication(), message);
        } else {
            super.onMessageReceived(remoteMessage);
        }
    }
}
