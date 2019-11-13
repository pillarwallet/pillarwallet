package com.bitgo.randombytes;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Callback;

import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.security.SecureRandom;
import java.util.Map;
import java.util.HashMap;

import android.util.Base64;

public class RandomBytesModule extends ReactContextBaseJavaModule {
  private static final String SEED_KEY = "seed";
  private SecureRandom secureRandom;

  public RandomBytesModule(ReactApplicationContext reactContext) {
    super(reactContext);
    secureRandom = new SecureRandom();
  }

  @Override
  public String getName() {
    return "RNRandomBytes";
  }

  @ReactMethod
  public void randomBytes(int size, Callback success) {
    success.invoke(null, getRandomBytes(size));
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put(SEED_KEY, getRandomBytes(4096));
    return constants;
  }

  private String getRandomBytes(int size) {
    byte[] output = new byte[size];
    secureRandom.nextBytes(output);
    return Base64.encodeToString(output, Base64.NO_WRAP);
  }
}
