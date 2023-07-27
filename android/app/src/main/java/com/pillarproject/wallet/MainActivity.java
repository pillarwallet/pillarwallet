package com.pillarproject.wallet;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import org.devio.rn.splashscreen.SplashScreen;

public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.show(this, true);  // react-native-splashscreen
        super.onCreate(savedInstanceState);
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     * @note https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot/
     */
    @Override
    protected String getMainComponentName() {
        return "pillarwallet";
    }
}
