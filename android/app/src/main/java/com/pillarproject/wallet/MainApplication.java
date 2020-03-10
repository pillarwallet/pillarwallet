package com.pillarproject.wallet;

import com.BV.LinearGradient.LinearGradientPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.crypho.scrypt.RNScryptPackage;
import com.facebook.react.PackageList;
import androidx.multidex.MultiDexApplication;
import com.facebook.react.ReactApplication;

import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import cl.json.RNSharePackage;
import io.expo.appearance.RNCAppearancePackage;
import io.intercom.android.sdk.Intercom;
import nativeShadow.NativeShadowPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.wix.reactnativenotifications.RNNotificationsPackage;

import java.util.List;

public class MainApplication extends MultiDexApplication implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // packages.add(new MyReactNativePackage());
        packages.add(new RNFetchBlobPackage());
        packages.add(new RNNotificationsPackage(MainApplication.this));
        packages.add(new NativeShadowPackage());
        return packages;
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
