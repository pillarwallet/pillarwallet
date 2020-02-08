package dk.madslee.imageCapInsets;

import android.graphics.drawable.NinePatchDrawable;
import java.util.HashMap;


public class RCTImageCache {
    private static RCTImageCache instance = null;
    private HashMap<String, NinePatchDrawable> mCache;

    public static RCTImageCache getInstance() {
        if (instance == null) {
            instance = new RCTImageCache();
        }

        return instance;
    }

    protected RCTImageCache() {
        mCache = new HashMap<>();
    }

    public void put(String key, NinePatchDrawable drawable) {
        mCache.put(key, drawable);
    }

    public NinePatchDrawable get(String key) {
        return mCache.get(key);
    }

    public boolean has(String key) {
        return mCache.containsKey(key);
    }
}
