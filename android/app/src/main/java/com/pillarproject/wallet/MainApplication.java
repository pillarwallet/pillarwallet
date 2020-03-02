package com.pillarproject.wallet;

import android.app.Application;

import androidx.multidex.MultiDexApplication;

import com.facebook.react.ReactApplication;

import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
import io.invertase.firebase.iid.ReactNativeFirebaseIidPackage;
import io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsPackage;
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import com.crypho.scrypt.RNScryptPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.swmansion.rnscreens.RNScreensPackage;

import io.intercom.android.sdk.Intercom;
import lt.imas.react_native_signal.RNSignalClientPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.tradle.react.UdpSocketsModule;
import com.reactlibrary.RNThreadPackage;
import com.peel.react.TcpSocketsModule;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import cl.json.RNSharePackage;
import io.sentry.RNSentryPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.peel.react.rnos.RNOSModule;
import com.BV.LinearGradient.LinearGradientPackage;
import com.oblador.keychain.KeychainPackage;
import com.robinpowered.react.Intercom.IntercomPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.psykar.cookiemanager.CookieManagerPackage;
import iyegoroff.RNColorMatrixImageFilters.ColorMatrixImageFiltersPackage;
import org.reactnative.camera.RNCameraPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import io.expo.appearance.RNCAppearancePackage;
import nativeShadow.NativeShadowPackage;

import com.airbnb.android.react.lottie.LottiePackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.mattblock.reactnative.inappbrowser.RNInAppBrowserPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends MultiDexApplication implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ReactNativeFirebaseAppPackage(),
            new ReactNativeFirebaseMessagingPackage(),
            new ReactNativeFirebaseIidPackage(),
            new ReactNativeFirebaseCrashlyticsPackage(),
            new ReactNativeFirebaseAnalyticsPackage(),
            new RNScryptPackage(),
            new RNFetchBlobPackage(),
            new RNGestureHandlerPackage(),
            new RNScreensPackage(),
            new RNSignalClientPackage(),
            new RNCWebViewPackage(),
            new VectorIconsPackage(),
            new UdpSocketsModule(),
            new RNThreadPackage(mReactNativeHost, new RandomBytesPackage()), // randombytes needed for connections keypair generation in thread
            new TcpSocketsModule(),
            new SvgPackage(),
            new SplashScreenReactPackage(),
            new RNSharePackage(),
            new RNSentryPackage(),
            new RandomBytesPackage(),
            new RNOSModule(),
            new LinearGradientPackage(),
            new KeychainPackage(),
            new IntercomPackage(),
            new PickerPackage(),
            new ExtraDimensionsPackage(),
            new RNDeviceInfo(),
            new CookieManagerPackage(),
            new ColorMatrixImageFiltersPackage(),
            new RNCameraPackage(),
            new BackgroundTimerPackage(),
            new RNCAppearancePackage(),
            new LottiePackage(),
            new AsyncStoragePackage(),
            new RNInAppBrowserPackage(),
            new NativeShadowPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    if (BuildConfig.DEBUG) {
      Intercom.initialize(this, "android_sdk-e8448a61a33991a680742cf91d68aaae8652d012", "xbjzrshe");
    } else {
      Intercom.initialize(this, "android_sdk-b989462efb366f8046f5ca1a12c75d67ecb7592c", "s70dqvb2");
    }
    SoLoader.init(this, /* native exopackage */ false);
    // TODO: remove this call?
//    long storageSizeMax = 60L * 1024L * 1024L; // 60 MB
//    com.facebook.react.modules.storage.ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(storageSizeMax);
  }
}
