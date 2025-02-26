package io.ionic.starter;
import static androidx.core.app.ActivityCompat.requestPermissions;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;
import android.content.SharedPreferences;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AlertDialog;

import com.google.firebase.Firebase;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;


import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {

  private static final String TAG = "MainActivity";
  private FirebaseAuth.AuthStateListener authStateListener;
  private static final int PERMISSION_REQUEST_CODE = 123;  // You can use any number

  private static final String BOOLEAN = "Can navigate back";

  // Declare the launcher at the top of your Activity/Fragment:
  private final ActivityResultLauncher<String> requestPermissionLauncher =
    registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
      Log.d(TAG, isGranted + " is Granted");
      if (isGranted) {
        Log.d(TAG, "Permission is granted");
        // FCM SDK (and your app) can post notifications.
      } else {
        Log.d(TAG, "Permission denied. Notifications will not be shown.");

        // Show a dialog or a Snackbar informing the user
        new AlertDialog.Builder(this)
          .setTitle("Permission Required")
          .setMessage("This app needs notification permission to keep you updated. You can enable it in settings.")
          .setPositiveButton("Open Settings", (dialog, which) -> {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getPackageName(), null);
            intent.setData(uri);
            startActivity(intent);
          })
          .setNegativeButton("Cancel", null)
          .show();
      }
    });


  @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);  // ✅ FIX 1: Move this to the top

//    setContentView(R.layout.activity_main);
    Log.d(TAG, "asking permission for notifications");
FirebaseApp.initializeApp(this);
    askNotificationPermission();  // ✅ FIX 2: Only call this, don't launch manually

    fetchFCMToken();
  }

  private void askNotificationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED) {
        Log.d(TAG, "Permission already granted");
      } else if (shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS)) {
        Log.d(TAG, "Should show rationale, showing dialog...");
        new AlertDialog.Builder(this)
          .setTitle("Enable Notifications")
          .setMessage("We need permission to send you reminders about upcoming payments and bills.")
          .setPositiveButton("Allow", (dialog, which) -> {
            requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS); // ✅ FIX 3: Use launcher
          })
          .setNegativeButton("Deny", (dialog, which) -> dialog.dismiss())
          .show();
      } else {
        // Directly ask for the permission
        requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS);
      }
    }
  }


  //
  private void fetchFCMToken() {
    FirebaseMessaging.getInstance().getToken()
      .addOnCompleteListener(new OnCompleteListener<String>() {
        @Override
        public void onComplete(@NonNull Task<String> task) {
          if (!task.isSuccessful()) {
            Log.w(TAG, "Fetching FCM registration token failed", task.getException());
            return;
          }

          // Get the FCM registration token
          String token = task.getResult();

          // Log and display the token
          String msg = "FCM Token: " + token;
          Log.d(TAG, msg);
        }
      });
  }


}


