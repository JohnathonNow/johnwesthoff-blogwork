package com.johnwesthoff.gmailphotoprinter;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.print.PrintHelper;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.InputStream;
import java.util.Properties;

import javax.mail.Flags;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.Part;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.search.FlagTerm;

public class EmailCheckerWorker extends Worker {

    private static final String TAG = "EmailCheckerWorker";

    public EmailCheckerWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        String email = getInputData().getString("email");
        String password = getInputData().getString("password");

        if (email == null || password == null) {
            return Result.failure();
        }

        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", "imaps");
            props.put("mail.imaps.host", "imap.gmail.com");
            props.put("mail.imaps.port", "993");

            Session session = Session.getDefaultInstance(props, null);
            Store store = session.getStore("imaps");
            store.connect("imap.gmail.com", email, password);

            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_WRITE);

            Message[] messages = inbox.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));

            for (Message message : messages) {
                if (message.getContent() instanceof Multipart) {
                    Multipart multipart = (Multipart) message.getContent();
                    for (int i = 0; i < multipart.getCount(); i++) {
                        Part part = multipart.getBodyPart(i);
                        if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
                            String fileName = part.getFileName();
                            if (fileName != null && (fileName.toLowerCase().endsWith(".jpg") ||
                                    fileName.toLowerCase().endsWith(".jpeg") ||
                                    fileName.toLowerCase().endsWith(".png"))) {

                                InputStream is = part.getInputStream();
                                Bitmap bitmap = BitmapFactory.decodeStream(is);

                                if (bitmap != null) {
                                    printBitmap(bitmap, fileName);
                                }
                            }
                        }
                    }
                }
                message.setFlag(Flags.Flag.SEEN, true);
            }

            inbox.close(false);
            store.close();
            return Result.success();

        } catch (Exception e) {
            Log.e(TAG, "Error checking emails", e);
            return Result.failure();
        }
    }

    private void printBitmap(Bitmap bitmap, String fileName) {
        PrintHelper printHelper = new PrintHelper(getApplicationContext());
        printHelper.setScaleMode(PrintHelper.SCALE_MODE_FIT);
        printHelper.printBitmap("Printing " + fileName, bitmap);
    }
}
