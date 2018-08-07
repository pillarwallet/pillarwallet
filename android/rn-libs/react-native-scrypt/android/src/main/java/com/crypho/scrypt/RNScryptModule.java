
package com.crypho.scrypt;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;

public class RNScryptModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("scrypt_jni");
  }

	private static final char[] HEX = {'0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'};
  private final ReactApplicationContext reactContext;
  private static final String SCRYPT_ERROR = "Failure in scrypt";

	public native byte[] scryptBridgeJNI(byte[] pass, char[] salt, Integer N, Integer r, Integer p, Integer dkLen);
  
  public RNScryptModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }


  @ReactMethod
  public void scrypt(
          String passwd,
          ReadableArray salt,
          Integer N,
          Integer r,
          Integer p,
          Integer dkLen,
          Promise promise) {
      try {
          final byte[] passwordBytes = passwd.getBytes("UTF-8");
          final char[] ssalt = getSalt(salt);
          byte[] res = scryptBridgeJNI(passwordBytes, ssalt, N, r, p, dkLen);
          String result = hexify(res);
          promise.resolve(result);
      } catch (Exception e) {
          promise.reject(SCRYPT_ERROR, e);
      }
  }

  private String hexify (byte[] input) {
  int len = input.length;
  char[] result = new char[2 * len];
  for ( int j = 0; j < len; j++ ) {
        int v = input[j] & 0xFF;
        result[j * 2] = HEX[v >>> 4];
        result[j * 2 + 1] = HEX[v & 0x0F];
    }
    return new String(result).toLowerCase();
  }

  private char[] getSalt(ReadableArray src){
    int s = src.size();
    char[] result = new char[s];
    for (int i = 0; i < s ; i++) {
      result[i] = (char) src.getInt(i);
    }
    return result;
  }

  @Override
  public String getName() {
    return "RNScrypt";
  }
}