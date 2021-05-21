package com.pillarproject.wallet;

import android.annotation.SuppressLint;
import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;
import com.wix.reactnativenotifications.fcm.FcmInstanceIdListenerService;

import java.util.Map;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class PillarFirebaseMessagingService extends FcmInstanceIdListenerService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d("onMessageReceived: ", remoteMessage.toString());
        Map message = remoteMessage.getData();
    }
}
