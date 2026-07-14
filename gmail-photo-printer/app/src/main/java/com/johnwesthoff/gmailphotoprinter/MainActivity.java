package com.johnwesthoff.gmailphotoprinter;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {

    private EditText emailEditText;
    private EditText passwordEditText;
    private Button startButton;
    private Button stopButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        emailEditText = findViewById(R.id.emailEditText);
        passwordEditText = findViewById(R.id.passwordEditText);
        startButton = findViewById(R.id.startButton);
        stopButton = findViewById(R.id.stopButton);

        startButton.setOnClickListener(v -> startCheckingEmails());
        stopButton.setOnClickListener(v -> stopCheckingEmails());
    }

    private void startCheckingEmails() {
        String email = emailEditText.getText().toString();
        String password = passwordEditText.getText().toString();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show();
            return;
        }

        Data inputData = new Data.Builder()
                .putString("email", email)
                .putString("password", password)
                .build();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(
                EmailCheckerWorker.class, 15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setInputData(inputData)
                .build();

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "EmailCheckerWork",
                androidx.work.ExistingPeriodicWorkPolicy.REPLACE,
                workRequest);

        Toast.makeText(this, "Started checking emails", Toast.LENGTH_SHORT).show();
    }

    private void stopCheckingEmails() {
        WorkManager.getInstance(this).cancelUniqueWork("EmailCheckerWork");
        Toast.makeText(this, "Stopped checking emails", Toast.LENGTH_SHORT).show();
    }
}
