package io.ionic.starter;
import static androidx.core.app.ActivityCompat.requestPermissions;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import android.content.SharedPreferences;

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
      if (isGranted) {
        // FCM SDK (and your app) can post notifications.
      } else {
        // TODO: Inform user that your app will not show notifications.
      }
    });

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    setContentView(R.layout.activity_main);
    super.onCreate(savedInstanceState);

    FirebaseApp.initializeApp(this);
    // Ask for notification permission (necessary for API level 33 and above)
    askNotificationPermission();
    Log.d(TAG, "setting up auth listener in on create");
    setupAuthStateListener();
    FirebaseAuth.getInstance().addAuthStateListener(authStateListener);
    // Fetch the FCM token when the app starts
    fetchFCMToken();
  }

  private void askNotificationPermission() {
    // This is only necessary for API level >= 33 (TIRAMISU)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED) {
        // FCM SDK (and your app) can post notifications.
      } else if (shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS)) {
        // TODO: display an educational UI explaining to the user the features that will be enabled
        //       by them granting the POST_NOTIFICATION permission.
        Log.d(TAG, "Should show rationale, showing dialog...");
        new AlertDialog.Builder(this)
          .setTitle("Enable Notifications")
          .setMessage("We need permission to send you reminders about upcoming payments and bills. These notifications will help you keep track of your expenses and never miss a payment.")
          .setPositiveButton("Allow", (dialog, which) -> {
            // Request permission after showing rationale
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
          })
          .setNegativeButton("Deny", (dialog, which) -> {
            // Handle the scenario when the user denies the permission
            dialog.dismiss();
          })
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
          Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
          sendRegistrationToServer(token);
        }
      });
  }
  @SuppressLint("LongLogTag")
  private String generateDeviceId() {
    SharedPreferences prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE);
    String deviceId = prefs.getString("device_id", null);

    // Generate and save the device ID if not already present
    if (deviceId == null) {
      deviceId = UUID.randomUUID().toString(); // Generate new UUID
      SharedPreferences.Editor editor = prefs.edit();
      editor.putString("device_id", deviceId);

      editor.apply(); // Save asynchronously
    }
  Log.d(TAG, prefs.getString("device_id", null));
    return deviceId;
  }

  @SuppressLint("LongLogTag")
  private void sendRegistrationToServer(String token) {
      // Firebase Firestore instance
    Log.d(TAG, "sending registration to server");
    FirebaseFirestore db = FirebaseFirestore.getInstance();
//    FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
//    assert user != null;
//    String uid = user.getUid();
//
//    {
//      Map<String, String> tokenData = new HashMap<>( );
//      tokenData.put("fcmToken", token);
//      db.collection("users")
//        .document(uid)
//        .set(tokenData, SetOptions.merge());
//
//    }
    String deviceId = generateDeviceId();

    Map<String, String> tokenData = new HashMap<>();
    tokenData.put("device_id", deviceId);
    tokenData.put("fcmToken", token);

    db.collection("device_tokens")
      .document(deviceId)
      .set(tokenData, SetOptions.merge())
      .addOnSuccessListener(aVoid -> {
        Log.d(TAG, "Saving token i successful");
      })
      .addOnFailureListener(e -> {
        Log.e(TAG, "Error saving token",e);
      });


    }
  private void setupAuthStateListener() {
    Log.d(TAG, "setting up auth listener") ;
    this.authStateListener = firebaseAuth -> {
      FirebaseUser user = firebaseAuth.getCurrentUser();
      if (user != null) {
        onUserAuthenticated(user);
      } else {
        // Handle the unauthenticated state
        Log.d("AuthStateListener", "User is not authenticated");
      }
    };
  }

    private void onUserAuthenticated(FirebaseUser user) {
      String uid = user.getUid();

      FirebaseFirestore db = FirebaseFirestore.getInstance();
      Map<String, String> tokenData = new HashMap<>();

      SharedPreferences prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE);
      String deviceId = prefs.getString("device_id", null);

      if (deviceId == null) {
        Log.e(TAG, "No token to store in user firestore");
        return;
      }

      DocumentReference docRef = db.collection("device_tokens")
        .document(deviceId);

      docRef.get()
        .addOnCompleteListener(task -> {
          if (task.isSuccessful()) {
            DocumentSnapshot document = task.getResult();
            if (document.exists()) {
              // Access the specific field you need (e.g., "fcmToken")
              String token = document.getString("fcmToken");
              tokenData.put("fcmToken", token);
              db.collection("users")
                .document(uid)

                .set(tokenData, SetOptions.merge());
              Log.d("Firestore", "FCM Token: " + token);
            } else {
              Log.d("Firestore", "No such document!");
            }
          } else {
            Log.e("Firestore", "Error getting document", task.getException());
          }
        });


    }
  }


