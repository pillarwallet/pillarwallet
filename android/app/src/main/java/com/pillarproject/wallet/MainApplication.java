package com.pillarproject.wallet;

import android.app.Application;

import com.BV.LinearGradient.LinearGradientPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.crashlytics.android.answers.Answers;
import com.crashlytics.android.Crashlytics;
import com.crypho.scrypt.RNScryptPackage;
import com.facebook.react.ReactApplication;
import com.smixx.fabric.FabricPackage;
import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.horcrux.svg.SvgPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.peel.react.TcpSocketsModule;
import com.peel.react.rnos.RNOSModule;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.robinpowered.react.Intercom.IntercomPackage;

import org.devio.rn.splashscreen.SplashScreenReactPackage;
import org.reactnative.camera.RNCameraPackage;

import java.util.Arrays;
import java.util.List;

import cl.json.RNSharePackage;
import cl.json.ShareApplication;
import io.fabric.sdk.android.Fabric;
import com.robinpowered.react.Intercom.IntercomPackage;
import io.intercom.android.sdk.Intercom;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.config.RNFirebaseRemoteConfigPackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.functions.RNFirebaseFunctionsPackage;
import io.invertase.firebase.instanceid.RNFirebaseInstanceIdPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.RNFirebasePackage;
import lt.imas.react_native_signal.RNSignalClientPackage;
import nativeShadow.NativeShadowPackage;
import iyegoroff.RNColorMatrixImageFilters.ColorMatrixImageFiltersPackage;
import io.sentry.RNSentryPackage;
import com.tradle.react.UdpSocketsModule;
import com.oblador.vectoricons.VectorIconsPackage;
import com.bitgo.randombytes.RandomBytesPackage;

import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.reactlibrary.RNThreadPackage;

// react-native-splash-screen >= 0.3.1


public class MainApplication extends Application implements ShareApplication, ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new ColorMatrixImageFiltersPackage(),
        new MainReactPackage(),
        new ExtraDimensionsPackage(),
        new FingerprintAuthPackage(),
        new RNSentryPackage(),
        new SvgPackage(),
        new UdpSocketsModule(),
        new TcpSocketsModule(),
        new RNScryptPackage(),
        new LottiePackage(),
        new RNSharePackage(),
        new FabricPackage(),
        new BackgroundTimerPackage(),
        new SplashScreenReactPackage(),
        new RNFetchBlobPackage(),
        new RNCameraPackage(),
        new RNSignalClientPackage(),
        new VectorIconsPackage(),
        new RNOSModule(),
        new RNFirebasePackage(),
        new RNFirebaseMessagingPackage(),
        new RNFirebaseCrashlyticsPackage(),
        new RNFirebaseInstanceIdPackage(),
        new RNFirebaseAnalyticsPackage(),
        new RNFirebaseNotificationsPackage(),
        new RNFirebaseRemoteConfigPackage(),
        new RNDeviceInfo(),
        new IntercomPackage(),
        new LinearGradientPackage(),
        new RandomBytesPackage(),
        new PickerPackage(),
        new NativeShadowPackage(),
        new RNThreadPackage(mReactNativeHost)
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    final Fabric fabric = new Fabric.Builder(this)
            .kits(new Crashlytics(), new Answers())
            .build();
    Fabric.with(fabric);
    if (BuildConfig.DEBUG) {
      Intercom.initialize(this, "android_sdk-e8448a61a33991a680742cf91d68aaae8652d012", "xbjzrshe");
    } else {
      Intercom.initialize(this, "android_sdk-b989462efb366f8046f5ca1a12c75d67ecb7592c", "s70dqvb2");
    }
    SoLoader.init(this, /* native exopackage */ false);
    long storageSizeMax = 60L * 1024L * 1024L; // 60 MB
    // Default size of AsyncStorage is 6MB
    com.facebook.react.modules.storage.ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(storageSizeMax);
  }

  @Override
  public String getFileProviderAuthority() {
    return "com.pillarproject.wallet.provider";
  }
}
