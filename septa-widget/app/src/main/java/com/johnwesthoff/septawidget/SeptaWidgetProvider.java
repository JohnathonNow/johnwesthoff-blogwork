package com.johnwesthoff.septawidget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SeptaWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "com.johnwesthoff.septawidget.SeptaWidgetProvider";
    private static final String PREF_PREFIX_KEY = "appwidget_";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, 0);
        String origin = prefs.getString(PREF_PREFIX_KEY + appWidgetId + "_origin", "Suburban Station");
        String destination = prefs.getString(PREF_PREFIX_KEY + appWidgetId + "_dest", "30th Street Station");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        views.setTextViewText(R.id.widget_title, origin + " to " + destination);
        views.setTextViewText(R.id.widget_departures, "Loading...");

        Intent intent = new Intent(context, SeptaWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, new int[]{appWidgetId});
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, appWidgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_layout_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        final PendingResult pendingResult = goAsync();
        executor.execute(() -> {
            String departuresText = fetchDepartures(origin, destination);
            handler.post(() -> {
                views.setTextViewText(R.id.widget_departures, departuresText);
                appWidgetManager.updateAppWidget(appWidgetId, views);
                if (pendingResult != null) {
                    pendingResult.finish();
                }
            });
        });
    }

    private String fetchDepartures(String origin, String destination) {
        try {
            String urlString = "https://www3.septa.org/api/NextToArrive/index.php?req1=" +
                    URLEncoder.encode(origin, "UTF-8") + "&req2=" +
                    URLEncoder.encode(destination, "UTF-8") + "&req3=3";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONArray jsonArray = new JSONArray(response.toString());
                StringBuilder result = new StringBuilder();
                for (int i = 0; i < jsonArray.length(); i++) {
                    JSONObject obj = jsonArray.getJSONObject(i);
                    String dep = obj.getString("orig_departure_time");
                    String delay = obj.getString("orig_delay");
                    String lineName = obj.getString("orig_line");
                    result.append(dep).append(" (").append(lineName).append(")");
                    if (!"On time".equalsIgnoreCase(delay)) {
                         result.append(" - ").append(delay);
                    }
                    result.append("\n");
                }
                if (result.length() == 0) {
                    return "No upcoming trains.";
                }
                return result.toString().trim();
            } else {
                return "Error: HTTP " + conn.getResponseCode();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Error fetching data.";
        }
    }
}
