package dk.madslee.imageCapInsets;

import android.content.Context;
import android.graphics.*;
import android.graphics.drawable.NinePatchDrawable;
import android.widget.ImageView;
import dk.madslee.imageCapInsets.utils.NinePatchBitmapFactory;
import dk.madslee.imageCapInsets.utils.RCTImageLoaderListener;
import dk.madslee.imageCapInsets.utils.RCTImageLoaderTask;


public class RCTImageCapInsetView extends ImageView {
    private Rect mCapInsets;
    private String mUri;

    public RCTImageCapInsetView(Context context) {
        super(context);

        mCapInsets = new Rect();
    }

    public void setCapInsets(Rect insets) {
        mCapInsets = insets;

        if (this.mUri != null)
        {
            reload();
        }
    }

    public void setSource(String uri) {
        mUri = uri;
        reload();
    }

    public void reload() {
        final String key = mUri + "-" + mCapInsets.toShortString();
        final RCTImageCache cache = RCTImageCache.getInstance();

        if (cache.has(key)) {
            setBackground(cache.get(key).getConstantState().newDrawable());
            return;
        }

        RCTImageLoaderTask task = new RCTImageLoaderTask(mUri, getContext(), new RCTImageLoaderListener() {
            @Override
            public void onImageLoaded(Bitmap bitmap) {
                int ratio = Math.round(bitmap.getDensity() / 160);
                int top = mCapInsets.top * ratio;
                int right = bitmap.getWidth() - (mCapInsets.right * ratio);
                int bottom = bitmap.getHeight() - (mCapInsets.bottom * ratio);
                int left = mCapInsets.left * ratio;

                NinePatchDrawable ninePatchDrawable = NinePatchBitmapFactory.createNinePathWithCapInsets(getResources(), bitmap, top, left, bottom, right, null);
                setBackground(ninePatchDrawable);

                cache.put(key, ninePatchDrawable);
            }
        });

        task.execute();
    }
}
