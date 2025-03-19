package io.ionic.starter;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class MyFirebaseMessagingService extends FirebaseMessagingService {

  private static final String TAG = "NotificationLog";
  String notificationIcon = "wallet";
  private static final String CHANNEL_ID = "Expense-manager";
@Override
  public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {

    super.onMessageReceived(remoteMessage); //delete pending messages

    if (!remoteMessage.getData().isEmpty()) {
      Log.d(TAG,"Message data payload: "+ remoteMessage.getData()); //in instance of a data notification
    }

    if (remoteMessage.getNotification() != null) {
      Log.d(TAG, "Notification received: " + remoteMessage.getNotification().getBody());
      showNotification(remoteMessage.getNotification().getBody(), remoteMessage.getNotification().getTitle());
    }

}
//
  private void showNotification(String body, String title) {

  //get a system service object (here the notification manager)
    NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

    Log.d(TAG, "Notification Manager Created");

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) { //If the sdk version is higher than 8.0
      NotificationChannel notificationChannel = new NotificationChannel(
        CHANNEL_ID,
        "Expense-manager-channel",
        NotificationManager.IMPORTANCE_HIGH //importance of the notification-channel belonging notifications
      );
      notificationManager.createNotificationChannel(notificationChannel);
    } //Create a notification channel here is mandatory for android versions higher than 8.0

    @SuppressLint("DiscouragedApi") NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_circle)
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH); //set the notification's priority, it may affect the display
    int notificationId = (int) System.currentTimeMillis(); // Generate unique notification ID
    notificationManager.notify(notificationId, notificationBuilder.build());
    Log.d(TAG, "Notification Received");
  }



}
