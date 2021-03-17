package com.pillarproject.wallet;

import android.content.Context;
import androidx.multidex.MultiDexApplication;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import io.branch.rnbranch.RNBranchModule;
import io.intercom.android.sdk.Intercom;
import nativeShadow.NativeShadowPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.soloader.SoLoader;
import com.wix.reactnativenotifications.RNNotificationsPackage;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import com.instabug.reactlibrary.RNInstabugReactnativePackage;

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
        RNBranchModule.getAutoInstance(this);
        if (BuildConfig.DEBUG) {
            Intercom.initialize(this, "android_sdk-e8448a61a33991a680742cf91d68aaae8652d012", "xbjzrshe");
        } else {
            Intercom.initialize(this, "android_sdk-b989462efb366f8046f5ca1a12c75d67ecb7592c", "s70dqvb2");
        }
        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());

        // react-native-async-storage custom max storage
        long storageSizeMax = 60L * 1024L * 1024L; // 60 MB
        com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(storageSizeMax);

        new RNInstabugReactnativePackage
            .Builder(getString(R.string.instabug_token), MainApplication.this)
            .setInvocationEvent("shake")
            .build();
    }

    /**
    * Loads Flipper in React Native templates. Call this in the onCreate method with something like
    * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    *
    * @param context
    * @param reactInstanceManager
    */
    private static void initializeFlipper(
        Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
                /*
                We use reflection here to pick up the class that initializes Flipper,
                since Flipper library is not available in release mode
                */
                Class<?> aClass = Class.forName("com.pillarproject.wallet.ReactNativeFlipper");
                aClass
                    .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }
}
