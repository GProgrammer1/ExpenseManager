
package io.ionic.starter;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toolbar;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AlertDialog;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.vectordrawable.graphics.drawable.AnimatedVectorDrawableCompat;

import com.airbnb.lottie.LottieAnimationView;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "MainActivity";
  private final ActivityResultLauncher<String> requestPermissionLauncher =
    registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
      Log.d(TAG, isGranted + " is Granted");
      if (isGranted) {
        Log.d(TAG, "Permission is granted");
      } else {
        Log.d(TAG, "Permission denied. Notifications will not be shown.");

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
    // Show the system splash screen
    FirebaseApp.initializeApp(this);
    super.onCreate(savedInstanceState);
//    hideSystemBars();
//    Window window = getWindow();
//    View decorView = window.getDecorView();
//
//    // Set a custom exit animation with a delay
//    WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
//    if (insetsController != null) {
//      insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
////    }
//

    androidx.appcompat.widget.Toolbar toolbar = findViewById(R.id.toolbar);
    setSupportActionBar(toolbar);
    View rootView = findViewById(android.R.id.content);

    ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, windowInsets) -> {

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

              Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
          view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
          return WindowInsetsCompat.CONSUMED;
        });
    // Adjust the status bar icon and text cView rootView = findViewById(android.R.id.content).getRootView();
    //////

    ////    Window window = getWindow();
    ////    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    ////
    ////    window.setStatusBarColor(Color.BLACK);olor for dark backgrounds

    askNotificationPermission();
    fetchFCMToken();
  }

  @RequiresApi(api = Build.VERSION_CODES.R)
  private void hideSystemBars() {
    final WindowInsetsController insetsController = getWindow().getInsetsController();
    if (insetsController != null) {
      insetsController.hide(WindowInsets.Type.statusBars());
      insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
  }

  private void askNotificationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS);
    }
  }

  private void fetchFCMToken() {
    FirebaseMessaging.getInstance().getToken().addOnCompleteListener(new OnCompleteListener<String>() {
      @Override
      public void onComplete(Task<String> task) {
        if (!task.isSuccessful()) {
          Log.w(TAG, "Fetching FCM token failed", task.getException());
          return;
        }
        String token = task.getResult();
        Log.d(TAG, "FCM Token: " + token);
      }
    });
  }
}
