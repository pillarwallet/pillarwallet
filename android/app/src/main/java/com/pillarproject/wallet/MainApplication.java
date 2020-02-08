package com.pillarproject.wallet;

import android.app.Application;

import com.facebook.react.ReactApplication;
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
import io.invertase.firebase.RNFirebasePackage;
import com.smixx.fabric.FabricPackage;
import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.psykar.cookiemanager.CookieManagerPackage;
import iyegoroff.RNColorMatrixImageFilters.ColorMatrixImageFiltersPackage;
import org.reactnative.camera.RNCameraPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import io.expo.appearance.RNCAppearancePackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.mattblock.reactnative.inappbrowser.RNInAppBrowserPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNSignalClientPackage(),
            new RNCWebViewPackage(),
            new VectorIconsPackage(),
            new UdpSocketsModule(),
            new RNThreadPackage(),
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
            new RNFirebasePackage(),
            new FabricPackage(),
            new ExtraDimensionsPackage(),
            new RNDeviceInfo(),
            new CookieManagerPackage(),
            new ColorMatrixImageFiltersPackage(),
            new RNCameraPackage(),
            new BackgroundTimerPackage(),
            new RNCAppearancePackage(),
            new LottiePackage(),
            new AsyncStoragePackage(),
            new RNInAppBrowserPackage()
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
    SoLoader.init(this, /* native exopackage */ false);
  }
}
