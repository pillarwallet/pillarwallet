package com.testfairy.react;

import android.app.Activity;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;

import com.testfairy.TestFairy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class TestFairyModule extends ReactContextBaseJavaModule {

    public TestFairyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "TestFairyBridge";
    }

    @ReactMethod
    public void begin(final String appKey, ReadableMap map) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.begin(getReactApplicationContext(), appKey);
            }
        });
    }

    @ReactMethod
    public void setCorrelationId(final String correlationId) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setCorrelationId(correlationId);
            }
        });
    }

    @ReactMethod
    public void identify(final String identity, final ReadableMap map) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                if (map == null) {
                    TestFairy.identify(identity, null);
                } else {
                    final Map<String, Object> traits = convertMap(map);
                    TestFairy.identify(identity, traits);
                }
            }
        });
    }

    @ReactMethod
    public void takeScreenshot() {
        Log.i("TestFairyModule", "Android does not support taking screen shots");
    }

    @ReactMethod
    public void pause() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.pause();
            }
        });
    }

    @ReactMethod
    public void pushFeedbackController() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.showFeedbackForm();
            }
        });
    }

    @ReactMethod
    public void resume() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.resume();
            }
        });
    }

    @ReactMethod
    public void checkpoint(final String checkpoint) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.addEvent(checkpoint);
            }
        });
    }

    @ReactMethod
    public void hideWebViewElements(final String cssSelector) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                Log.i("TestFairyModule", "Android does not support hiding web view elements");
            }
        });
    }

    @ReactMethod
    public void sendUserFeedback(final String feedback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.sendUserFeedback(feedback);
            }
        });
    }

    @ReactMethod
    public void setServerEndpoint(final String url) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setServerEndpoint(url);
            }
        });
    }

    @ReactMethod
    public void log(final String message) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.log("TFReactNative", message);
            }
        });
    }

    @ReactMethod
    public void sessionUrl(final Callback callback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                callback.invoke(TestFairy.getSessionUrl());
            }
        });
    }

    @ReactMethod
    public void version(final Callback callback) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                callback.invoke(TestFairy.getSessionUrl());
            }
        });
    }

    @ReactMethod
    public void setScreenName(final String name) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setScreenName(name);
            }
        });
    }

    @ReactMethod
    public void stop() {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.stop();
            }
        });
    }

    @ReactMethod
    public void setUserId(final String userId) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setUserId(userId);
            }
        });
    }

    @ReactMethod
    public void setAttribute(final String key, final String value) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.setAttribute(key, value);
            }
        });
    }

    @ReactMethod
    public void hideView(final int tag) {
        runOnUi(new Runnable() {
            @Override
            public void run() {
                TestFairy.hideView(tag);
            }
        });
    }

		@ReactMethod
    public void enableCrashHandler() {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.enableCrashHandler();
					}
			});
		}

		@ReactMethod
    public void disableCrashHandler() {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.disableCrashHandler();
					}
			});
		}

		@ReactMethod
    public void enableMetric(final String metric) {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.enableMetric(metric);
					}
			});
		}

		@ReactMethod
    public void disableMetric(final String metric) {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.disableMetric(metric);
					}
			});
		}

		@ReactMethod
    public void enableVideo(final String policy, final String quality, final float framesPerSecond) {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.enableVideo(policy, quality, framesPerSecond);
					}
			});
		}

		@ReactMethod
    public void disableVideo() {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.disableVideo();
					}
			});
		}

		@ReactMethod
    public void enableFeedbackForm(final String method) {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.enableFeedbackForm(method);
					}
			});
		}

		@ReactMethod
    public void disableFeedbackForm() {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.disableFeedbackForm();
					}
			});
		}

		@ReactMethod
    public void setMaxSessionLength(final float seconds) {
			runOnUi(new Runnable() {
					@Override
					public void run() {
							TestFairy.setMaxSessionLength(seconds);
					}
			});
		}

    private Map<String, Object> convertMap(ReadableMap map) {
        Map<String, Object> input = new HashMap<String, Object>();
        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType type = map.getType(key);
            switch (type) {
                case Boolean:
                    input.put(key, map.getBoolean(key));
                    break;
                case String:
                    input.put(key, map.getString(key));
                    break;
                case Number:
                    input.put(key, map.getDouble(key));
                    break;
                case Array:
                    input.put(key, convertArray(map.getArray(key)));
                    break;
                case Map:
                    input.put(key, convertMap(map.getMap(key)));
                default:
                    break;
            }
        }

        return input;
    }

    private ArrayList<Object> convertArray(ReadableArray array) {
        ArrayList<Object> input = new ArrayList<Object>();
        ReadableType singleType = null;
        for (int index = 0; index < array.size(); index++) {
            ReadableType type = array.getType(index);
            if (singleType == null)
                singleType = type;

            if (type != singleType) {
                Log.d("TestFairyModule", "Cannot mix types in array objects expecting type [" + singleType + "] found [" + type + "] in array. Skipping");
                continue;
            }

            switch (type) {
                case Boolean:
                    input.add(array.getBoolean(index));
                    break;
                case String:
                    input.add(array.getString(index));
                    break;
                case Number:
                    input.add(array.getDouble(index));
                    break;
                case Array:
                    input.add(convertArray(array.getArray(index)));
                    break;
                case Map:
                    input.add(convertMap(array.getMap(index)));
                default:
                    break;
            }
        }

        return input;
    }

    private void runOnUi(Runnable runnable) {
        UiThreadUtil.runOnUiThread(runnable);
    }
}
