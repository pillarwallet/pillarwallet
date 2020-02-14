package nativeShadow;
import android.content.Context;
import android.graphics.Color;
import com.gigamole.library.ShadowLayout;

public class NativeShadowView extends ShadowLayout {
    public NativeShadowView(Context context) {
        super(context);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        super.requestLayout();
        super.setBackgroundColor(Color.TRANSPARENT);
    }
}