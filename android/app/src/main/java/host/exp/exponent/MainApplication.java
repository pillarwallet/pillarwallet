package host.exp.exponent;


import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expolib_v1.okhttp3.OkHttpClient;

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;
import lt.imas.react_native_signal.RNSignalClientPackage;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import com.bitgo.randombytes.RandomBytesPackage;
import com.peel.react.rnos.RNOSModule;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;

import com.robinpowered.react.Intercom.IntercomPackage;
import io.intercom.android.sdk.Intercom;

public class MainApplication extends ExpoApplication {

  @Override
  public void onCreate() {
    super.onCreate();
    if (BuildConfig.DEBUG) {
      Intercom.initialize(this, "android_sdk-e8448a61a33991a680742cf91d68aaae8652d012", "xbjzrshe");
    } else {
      Intercom.initialize(this, "android_sdk-b989462efb366f8046f5ca1a12c75d67ecb7592c", "s70dqvb2");
    }
  }


  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  // Needed for `react-native link`
  public List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        // Add your own packages here!
        // TODO: add native modules!

        // Needed for `react-native link`
        // new MainReactPackage(),
            new RNSignalClientPackage(),
            new IntercomPackage(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new RandomBytesPackage(),
            new RNOSModule(),
            new RNFirebasePackage(),
            new RNFirebaseMessagingPackage(),
            new RNDeviceInfo()
    );
  }

  @Override
  public String gcmSenderId() {
    return getString(R.string.gcm_defaultSenderId);
  }

  @Override
  public boolean shouldUseInternetKernel() {
    return BuildVariantConstants.USE_INTERNET_KERNEL;
  }

  public static OkHttpClient.Builder okHttpClientBuilder(OkHttpClient.Builder builder) {
    // Customize/override OkHttp client here
    return builder;
  }
}
