/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Region;
import android.net.Uri;

import com.facebook.common.executors.UiThreadImmediateExecutorService;
import com.facebook.common.logging.FLog;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableBitmap;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.imagehelper.ImageSource;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class ImageView extends RenderableView {
    private SVGLength mX;
    private SVGLength mY;
    private SVGLength mW;
    private SVGLength mH;
    private String uriString;
    private int mImageWidth;
    private int mImageHeight;
    private String mAlign;
    private int mMeetOrSlice;
    private final AtomicBoolean mLoading = new AtomicBoolean(false);

    public ImageView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "x")
    public void setX(Dynamic x) {
        mX = getLengthFromDynamic(x);
        invalidate();
    }

    @ReactProp(name = "y")
    public void setY(Dynamic y) {
        mY = getLengthFromDynamic(y);
        invalidate();
    }

    @ReactProp(name = "width")
    public void setWidth(Dynamic width) {
        mW = getLengthFromDynamic(width);
        invalidate();
    }

    @ReactProp(name = "height")
    public void setHeight(Dynamic height) {
        mH = getLengthFromDynamic(height);
        invalidate();
    }

    @ReactProp(name = "src")
    public void setSrc(@Nullable ReadableMap src) {
        if (src != null) {
            uriString = src.getString("uri");

            if (uriString == null || uriString.isEmpty()) {
                //TODO: give warning about this
                return;
            }

            if (src.hasKey("width") && src.hasKey("height")) {
                mImageWidth = src.getInt("width");
                mImageHeight = src.getInt("height");
            } else {
                mImageWidth = 0;
                mImageHeight = 0;
            }
            Uri mUri = Uri.parse(uriString);
            if (mUri.getScheme() == null) {
                ResourceDrawableIdHelper.getInstance().getResourceDrawableUri(mContext, uriString);
            }
        }
    }

    @ReactProp(name = "align")
    public void setAlign(String align) {
        mAlign = align;
        invalidate();
    }

    @ReactProp(name = "meetOrSlice")
    public void setMeetOrSlice(int meetOrSlice) {
        mMeetOrSlice = meetOrSlice;
        invalidate();
    }

    @Override
    void draw(final Canvas canvas, final Paint paint, final float opacity) {
        if (!mLoading.get()) {
            final ImageSource imageSource = new ImageSource(mContext, uriString);

            final ImageRequest request = ImageRequestBuilder.newBuilderWithSource(imageSource.getUri()).build();
            if (Fresco.getImagePipeline().isInBitmapMemoryCache(request)) {
                tryRender(request, canvas, paint, opacity * mOpacity);
            } else {
                loadBitmap(request);
            }
        }
    }

    @Override
    Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        path.addRect(getRect(), Path.Direction.CW);
        return path;
    }

    private void loadBitmap(ImageRequest request) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchDecodedImage(request, mContext);
        dataSource.subscribe(new BaseBitmapDataSubscriber() {
                                 @Override
                                 public void onNewResultImpl(Bitmap bitmap) {
                                     mLoading.set(false);
                                     SvgView view = getSvgView();
                                     if (view != null) {
                                         view.invalidate();
                                     }
                                 }

                                 @Override
                                 public void onFailureImpl(DataSource dataSource) {
                                     // No cleanup required here.
                                     // TODO: more details about this failure
                                     mLoading.set(false);
                                     FLog.w(ReactConstants.TAG, dataSource.getFailureCause(), "RNSVG: fetchDecodedImage failed!");
                                 }
                             },
            UiThreadImmediateExecutorService.getInstance()
        );
    }

    @Nonnull
    private RectF getRect() {
        double x = relativeOnWidth(mX);
        double y = relativeOnHeight(mY);
        double w = relativeOnWidth(mW);
        double h = relativeOnHeight(mH);
        if (w == 0) {
            w = mImageWidth * mScale;
        }
        if (h == 0) {
            h = mImageHeight * mScale;
        }

        return new RectF((float)x, (float)y, (float)(x + w), (float)(y + h));
    }

    private void doRender(Canvas canvas, Paint paint, Bitmap bitmap, float opacity) {
        if (mImageWidth == 0 || mImageHeight == 0) {
            mImageWidth = bitmap.getWidth();
            mImageHeight = bitmap.getHeight();
        }

        RectF renderRect = getRect();
        RectF vbRect = new RectF(0, 0, mImageWidth, mImageHeight);
        Matrix transform = ViewBox.getTransform(vbRect, renderRect, mAlign, mMeetOrSlice);
        transform.mapRect(vbRect);

        if (mMatrix != null) {
            mMatrix.mapRect(vbRect);
        }

        Path clip = new Path();
        Path clipPath = getClipPath(canvas, paint);
        Path path = getPath(canvas, paint);
        if (clipPath != null) {
            // clip by the common area of clipPath and mPath
            clip.setFillType(Path.FillType.INVERSE_EVEN_ODD);

            Path inverseWindingPath = new Path();
            inverseWindingPath.setFillType(Path.FillType.INVERSE_WINDING);
            inverseWindingPath.addPath(path);
            inverseWindingPath.addPath(clipPath);

            Path evenOddPath = new Path();
            evenOddPath.setFillType(Path.FillType.EVEN_ODD);
            evenOddPath.addPath(path);
            evenOddPath.addPath(clipPath);

            canvas.clipPath(evenOddPath, Region.Op.DIFFERENCE);
            canvas.clipPath(inverseWindingPath, Region.Op.DIFFERENCE);
        } else {
            canvas.clipPath(path, Region.Op.REPLACE);
        }

        Paint alphaPaint = new Paint();
        alphaPaint.setAlpha((int) (opacity * 255));
        canvas.drawBitmap(bitmap, null, vbRect, alphaPaint);
    }

    private void tryRender(ImageRequest request, Canvas canvas, Paint paint, float opacity) {
        final DataSource<CloseableReference<CloseableImage>> dataSource
            = Fresco.getImagePipeline().fetchImageFromBitmapCache(request, mContext);

        try {
            final CloseableReference<CloseableImage> imageReference = dataSource.getResult();
            if (imageReference != null) {
                try {
                    if (imageReference.get() instanceof CloseableBitmap) {
                        final Bitmap bitmap = ((CloseableBitmap) imageReference.get()).getUnderlyingBitmap();

                        if (bitmap != null) {
                            doRender(canvas, paint, bitmap, opacity);
                        }
                    }
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                } finally {
                    CloseableReference.closeSafely(imageReference);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException(e);
        } finally {
            dataSource.close();
        }
    }

}
