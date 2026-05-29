package com.johnwesthoff.septawidget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;

public class SeptaWidgetConfigureActivity extends Activity {

    private static final String PREFS_NAME = "com.johnwesthoff.septawidget.SeptaWidgetProvider";
    private static final String PREF_PREFIX_KEY = "appwidget_";
    int mAppWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    EditText mOriginText;
    EditText mDestText;

    public SeptaWidgetConfigureActivity() {
        super();
    }

    @Override
    public void onCreate(Bundle icicle) {
        super.onCreate(icicle);
        setResult(RESULT_CANCELED);
        setContentView(R.layout.activity_configure);

        mOriginText = findViewById(R.id.origin_edit);
        mDestText = findViewById(R.id.dest_edit);
        findViewById(R.id.add_button).setOnClickListener(mOnClickListener);

        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            mAppWidgetId = extras.getInt(
                    AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (mAppWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        mOriginText.setText(loadPref(this, mAppWidgetId, "_origin", "Suburban Station"));
        mDestText.setText(loadPref(this, mAppWidgetId, "_dest", "30th Street Station"));
    }

    View.OnClickListener mOnClickListener = new View.OnClickListener() {
        public void onClick(View v) {
            final Context context = SeptaWidgetConfigureActivity.this;
            String origin = mOriginText.getText().toString();
            String dest = mDestText.getText().toString();
            savePref(context, mAppWidgetId, "_origin", origin);
            savePref(context, mAppWidgetId, "_dest", dest);

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            Intent intent = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE, null, context, SeptaWidgetProvider.class);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, new int[]{mAppWidgetId});
            sendBroadcast(intent);

            Intent resultValue = new Intent();
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, mAppWidgetId);
            setResult(RESULT_OK, resultValue);
            finish();
        }
    };

    static void savePref(Context context, int appWidgetId, String suffix, String text) {
        SharedPreferences.Editor prefs = context.getSharedPreferences(PREFS_NAME, 0).edit();
        prefs.putString(PREF_PREFIX_KEY + appWidgetId + suffix, text);
        prefs.apply();
    }

    static String loadPref(Context context, int appWidgetId, String suffix, String defaultText) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, 0);
        return prefs.getString(PREF_PREFIX_KEY + appWidgetId + suffix, defaultText);
    }
}
