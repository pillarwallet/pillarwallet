package com.pillarproject.wallet;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import io.branch.rnbranch.RNBranchModule;
import org.devio.rn.splashscreen.SplashScreen;

import android.content.Intent;
import android.content.res.Configuration;

public class MainActivity extends ReactActivity {
    protected void onCreate(Bundle savedInstanceState) {
        switch (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) {
            case Configuration.UI_MODE_NIGHT_YES:
                setTheme(R.style.DarkTheme);
                break;
            case Configuration.UI_MODE_NIGHT_NO:
                setTheme(R.style.LightTheme);
                break;
            default:
                setTheme(R.style.LightTheme);
        }
        SplashScreen.show(this, true);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
    }
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "pillarwallet";
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (BuildConfig.DEBUG) RNBranchModule.setDebug();
        RNBranchModule.initSession(getIntent().getData(), this);
    }

    @Override
    public void onResume() {
        super.onResume();
        ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
        if(reactContext != null) {
            getReactInstanceManager().getCurrentReactContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("ActivityStateChange", "active");
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
        if(reactContext != null) {
            getReactInstanceManager().getCurrentReactContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("ActivityStateChange", "inactive");
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
        if(reactContext != null) {
            getReactInstanceManager().getCurrentReactContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("ActivityStateChange", "background");
        }
    }

    // Needed for Branch.io
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }

    // react-native-appearance
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        sendBroadcast(intent);
    }
}
