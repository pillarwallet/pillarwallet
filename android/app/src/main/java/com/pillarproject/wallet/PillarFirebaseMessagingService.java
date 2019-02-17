package com.pillarproject.wallet;

import android.content.Intent;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.facebook.react.HeadlessJsTaskService;
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
        } else if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "onMessageReceived notification");
            // It's a notification, pass to the Notifications module
            Intent notificationEvent = new Intent(REMOTE_NOTIFICATION_EVENT);
            notificationEvent.putExtra("notification", remoteMessage);

            // Broadcast it to the (foreground) RN Application
            LocalBroadcastManager.getInstance(this).sendBroadcast(notificationEvent);
        } else {
            Log.d(TAG, "onMessageReceived data message");
            // It's a data message
            // If the app is in the foreground we send it to the Messaging module
            if (Utils.isAppInForeground(this.getApplicationContext())) {
                Intent messagingEvent = new Intent(MESSAGE_EVENT);
                messagingEvent.putExtra("message", remoteMessage);
                // Broadcast it so it is only available to the RN Application
                LocalBroadcastManager.getInstance(this).sendBroadcast(messagingEvent);
            } else {
                try {
                    // If the app is in the background we send it to the Headless JS Service
                    Intent headlessIntent = new Intent(this.getApplicationContext(), RNFirebaseBackgroundMessagingService.class);
                    headlessIntent.putExtra("message", remoteMessage);
                    this.getApplicationContext().startService(headlessIntent);
                    HeadlessJsTaskService.acquireWakeLockNow(this.getApplicationContext());
                } catch (IllegalStateException ex) {
                    Log.e(TAG, "Background messages will only work if the message priority is set to 'high'", ex);
                }
            }
        }
    }
}
