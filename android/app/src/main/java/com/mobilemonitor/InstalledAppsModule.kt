package com.mobilemonitor

import android.app.usage.NetworkStats
import android.app.usage.NetworkStatsManager
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.pm.PackageInfo
import android.app.usage.UsageStatsManager
import android.content.Context
import android.net.ConnectivityManager
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.text.SimpleDateFormat
import java.util.*

class InstalledAppsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "InstalledApps"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val installedPackages = packageManager.getInstalledPackages(PackageManager.GET_PERMISSIONS)
            val apps = WritableNativeArray()

            for (packageInfo in installedPackages) {
                val appInfo = packageInfo.applicationInfo ?: continue
                
                // Include all apps (both system and user-installed)
                // Filter out only if app has no launcher icon (background services/components)
                val launcherIntent = packageManager.getLaunchIntentForPackage(packageInfo.packageName)
                if (launcherIntent == null) {
                    // Skip apps without launcher activity (system components, services)
                    continue
                }
                
                val appInfoMap = WritableNativeMap()
                
                try {
                    val appName = packageManager.getApplicationLabel(appInfo).toString()
                    appInfoMap.putString("appName", appName)
                    appInfoMap.putString("packageName", packageInfo.packageName)
                    appInfoMap.putString("versionName", packageInfo.versionName ?: "Unknown")
                    appInfoMap.putInt("versionCode", packageInfo.versionCode)
                    
                    // Get install date
                    appInfoMap.putDouble("firstInstallTime", packageInfo.firstInstallTime.toDouble())
                    appInfoMap.putDouble("lastUpdateTime", packageInfo.lastUpdateTime.toDouble())
                    
                    // Mark if it's a system app
                    val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    appInfoMap.putBoolean("isSystemApp", isSystemApp)
                    
                    // Get permissions
                    val permissions = WritableNativeArray()
                    packageInfo.requestedPermissions?.forEach { permission ->
                        // Only include dangerous permissions that users should be aware of
                        if (isDangerousPermission(permission)) {
                            permissions.pushString(getSimplePermissionName(permission))
                        }
                    }
                    appInfoMap.putArray("permissions", permissions)
                    
                    // Get app icon as base64
                    try {
                        val drawable = packageManager.getApplicationIcon(appInfo)
                        val bitmap = drawableToBitmap(drawable)
                        val base64Icon = bitmapToBase64(bitmap)
                        appInfoMap.putString("icon", base64Icon)
                    } catch (e: Exception) {
                        appInfoMap.putString("icon", "default")
                    }
                    
                    // Get app size information
                    try {
                        val sourceDir = appInfo.sourceDir
                        val apkFile = java.io.File(sourceDir)
                        val appSize = if (apkFile.exists()) apkFile.length() else 0L
                        appInfoMap.putDouble("size", appSize.toDouble())
                    } catch (e: Exception) {
                        // Fallback: estimate size based on app type
                        val estimatedSize = when {
                            appName.contains("Game", ignoreCase = true) -> 100 * 1024 * 1024L // 100MB for games
                            permissions.toArrayList().size > 5 -> 50 * 1024 * 1024L // 50MB for feature-rich apps
                            else -> 25 * 1024 * 1024L // 25MB for simple apps
                        }
                        appInfoMap.putDouble("size", estimatedSize.toDouble())
                    }
                    
                    // Try to get usage stats (requires special permission)
                    val usageData = getUsageStatsDetailed(packageInfo.packageName)
                    var lastTimeUsed = usageData.first
                    
                    // If no usage data found, use lastUpdateTime as fallback
                    // This ensures we show at least some timestamp for all apps
                    if (lastTimeUsed == 0L) {
                        lastTimeUsed = packageInfo.lastUpdateTime
                        Log.d("InstalledAppsModule", "No usage stats for ${packageInfo.packageName}, using lastUpdateTime: $lastTimeUsed")
                    }
                    
                    appInfoMap.putDouble("lastTimeUsed", lastTimeUsed.toDouble())
                    appInfoMap.putDouble("totalTimeInForeground", usageData.second.toDouble())
                    appInfoMap.putInt("launchCount", usageData.third)
                    
                    apps.pushMap(appInfoMap)
                } catch (e: Exception) {
                    // Skip this app if there's an error getting its info
                    Log.w("InstalledAppsModule", "Error processing app ${packageInfo.packageName}: ${e.message}")
                    continue
                }
            }
            
            Log.d("InstalledAppsModule", "Total apps retrieved: ${apps.size()}")
            promise.resolve(apps)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", "Failed to get installed apps: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getAppDetails(packageName: String, promise: Promise) {
        try {
            val packageManager = reactApplicationContext.packageManager
            val packageInfo = packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val applicationInfo = packageInfo.applicationInfo ?: throw Exception("Application info not found")
            
            val appInfo = WritableNativeMap()
            val appName = packageManager.getApplicationLabel(applicationInfo).toString()
            
            appInfo.putString("appName", appName)
            appInfo.putString("packageName", packageName)
            appInfo.putString("versionName", packageInfo.versionName ?: "Unknown")
            appInfo.putInt("versionCode", packageInfo.versionCode)
            appInfo.putDouble("firstInstallTime", packageInfo.firstInstallTime.toDouble())
            appInfo.putDouble("lastUpdateTime", packageInfo.lastUpdateTime.toDouble())
            
            // Get detailed permissions
            val permissions = WritableNativeArray()
            val permissionDetails = WritableNativeArray()
            
            packageInfo.requestedPermissions?.forEachIndexed { index, permission ->
                if (isDangerousPermission(permission)) {
                    permissions.pushString(getSimplePermissionName(permission))
                    
                    val permDetail = WritableNativeMap()
                    permDetail.putString("name", getSimplePermissionName(permission))
                    permDetail.putString("fullName", permission)
                    permDetail.putString("description", getPermissionDescription(permission))
                    permDetail.putString("riskLevel", getPermissionRiskLevel(permission))
                    
                    // Check if permission is granted
                    val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        packageManager.checkPermission(permission, packageName) == PackageManager.PERMISSION_GRANTED
                    } else {
                        true // Pre-M permissions were granted at install time
                    }
                    permDetail.putBoolean("isGranted", isGranted)
                    
                    permissionDetails.pushMap(permDetail)
                }
            }
            
            appInfo.putArray("permissions", permissions)
            appInfo.putArray("permissionDetails", permissionDetails)
            
            // Add network usage data
            try {
                val networkUsage = getNetworkUsageForApp(packageName)
                appInfo.putMap("networkUsage", networkUsage)
            } catch (e: Exception) {
                Log.w("InstalledAppsModule", "Could not get network usage for $packageName", e)
            }
            
            promise.resolve(appInfo)
        } catch (e: Exception) {
            promise.reject("GET_APP_DETAILS_ERROR", "Failed to get app details: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getNetworkUsage(packageName: String, promise: Promise) {
        try {
            val networkUsage = getNetworkUsageForApp(packageName)
            promise.resolve(networkUsage)
        } catch (e: Exception) {
            promise.reject("NETWORK_USAGE_ERROR", "Failed to get network usage: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getAllAppsNetworkUsage(promise: Promise) {
        try {
            val allUsage = WritableNativeArray()
            val packageManager = reactApplicationContext.packageManager
            val installedPackages = packageManager.getInstalledPackages(0)
            
            for (packageInfo in installedPackages) {
                val appInfo = packageInfo.applicationInfo ?: continue
                
                // Only include apps with launcher intent
                val launcherIntent = packageManager.getLaunchIntentForPackage(packageInfo.packageName)
                if (launcherIntent == null) {
                    continue
                }
                
                try {
                    val appUsage = WritableNativeMap()
                    appUsage.putString("packageName", packageInfo.packageName)
                    appUsage.putString("appName", packageManager.getApplicationLabel(appInfo).toString())
                    
                    val networkUsage = getNetworkUsageForApp(packageInfo.packageName)
                    appUsage.putMap("networkUsage", networkUsage)
                    
                    allUsage.pushMap(appUsage)
                } catch (e: Exception) {
                    // Skip apps that we can't get usage for
                    Log.w("InstalledAppsModule", "Error getting network usage for ${packageInfo.packageName}: ${e.message}")
                    continue
                }
            }
            
            Log.d("InstalledAppsModule", "Total apps with network usage: ${allUsage.size()}")
            promise.resolve(allUsage)
        } catch (e: Exception) {
            promise.reject("ALL_NETWORK_USAGE_ERROR", "Failed to get all network usage: ${e.message}", e)
        }
    }

    private fun isDangerousPermission(permission: String): Boolean {
        return when {
            permission.contains("CAMERA") -> true
            permission.contains("LOCATION") -> true
            permission.contains("MICROPHONE") || permission.contains("RECORD_AUDIO") -> true
            permission.contains("CONTACTS") -> true
            permission.contains("PHONE") -> true
            permission.contains("SMS") -> true
            permission.contains("CALENDAR") -> true
            permission.contains("STORAGE") || permission.contains("READ_EXTERNAL") || permission.contains("WRITE_EXTERNAL") -> true
            permission.contains("BODY_SENSORS") -> true
            else -> false
        }
    }

    private fun getSimplePermissionName(permission: String): String {
        return when {
            permission.contains("CAMERA") -> "CAMERA"
            permission.contains("ACCESS_FINE_LOCATION") || permission.contains("ACCESS_COARSE_LOCATION") -> "LOCATION"
            permission.contains("RECORD_AUDIO") -> "MICROPHONE"
            permission.contains("READ_CONTACTS") || permission.contains("WRITE_CONTACTS") -> "CONTACTS"
            permission.contains("READ_PHONE") || permission.contains("CALL_PHONE") -> "PHONE"
            permission.contains("SEND_SMS") || permission.contains("READ_SMS") -> "SMS"
            permission.contains("READ_CALENDAR") || permission.contains("WRITE_CALENDAR") -> "CALENDAR"
            permission.contains("READ_EXTERNAL_STORAGE") || permission.contains("WRITE_EXTERNAL_STORAGE") -> "STORAGE"
            permission.contains("BODY_SENSORS") -> "SENSORS"
            else -> permission.substringAfterLast(".")
        }
    }

    private fun getPermissionDescription(permission: String): String {
        return when {
            permission.contains("CAMERA") -> "Access to device camera for taking photos and videos"
            permission.contains("LOCATION") -> "Access to device location for location-based services"
            permission.contains("RECORD_AUDIO") -> "Access to microphone for recording audio"
            permission.contains("CONTACTS") -> "Access to contacts stored on the device"
            permission.contains("PHONE") -> "Access to phone features and phone state"
            permission.contains("SMS") -> "Access to SMS messages"
            permission.contains("CALENDAR") -> "Access to calendar events"
            permission.contains("STORAGE") -> "Access to files stored on the device"
            permission.contains("BODY_SENSORS") -> "Access to body sensors like heart rate monitors"
            else -> "System permission"
        }
    }

    private fun getPermissionRiskLevel(permission: String): String {
        return when {
            permission.contains("CAMERA") || permission.contains("LOCATION") || permission.contains("RECORD_AUDIO") -> "HIGH"
            permission.contains("CONTACTS") || permission.contains("PHONE") || permission.contains("SMS") -> "HIGH"
            permission.contains("STORAGE") || permission.contains("CALENDAR") -> "MEDIUM"
            permission.contains("BODY_SENSORS") -> "MEDIUM"
            else -> "LOW"
        }
    }

    private fun getUsageStats(packageName: String): Long {
        return try {
            // First check if we have usage stats permission
            if (!hasUsageStatsPermissionInternal()) {
                Log.w("InstalledAppsModule", "Usage stats permission not granted, returning 0 for lastTimeUsed")
                return 0L
            }

            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val endTime = System.currentTimeMillis()
            
            // Try multiple time ranges - start with a very long period to capture any usage
            val timeRanges = arrayOf(
                365, // 1 year
                180, // 6 months
                90,  // 3 months
                30,  // 1 month
                7    // 1 week
            )
            
            // Try different intervals with different time ranges
            for (days in timeRanges) {
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.DAY_OF_YEAR, -days)
                val startTime = calendar.timeInMillis
                
                // Try INTERVAL_BEST first as it's most comprehensive
                val intervals = arrayOf(
                    UsageStatsManager.INTERVAL_BEST,
                    UsageStatsManager.INTERVAL_DAILY,
                    UsageStatsManager.INTERVAL_WEEKLY,
                    UsageStatsManager.INTERVAL_MONTHLY,
                    UsageStatsManager.INTERVAL_YEARLY
                )

                for (interval in intervals) {
                    try {
                        val usageStatsList = usageStatsManager.queryUsageStats(interval, startTime, endTime)
                        if (usageStatsList != null && usageStatsList.isNotEmpty()) {
                            // Find stats for this specific package
                            val usageStat = usageStatsList.find { it.packageName == packageName }
                            if (usageStat != null && usageStat.lastTimeUsed > 0) {
                                Log.d("InstalledAppsModule", "Found usage data for $packageName (${days}d, interval=$interval): lastTimeUsed=${usageStat.lastTimeUsed}")
                                return usageStat.lastTimeUsed
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("InstalledAppsModule", "Error querying usage stats with interval $interval for $days days", e)
                        continue
                    }
                }
            }
            
            // Last resort: try querying with events API which can be more reliable on some devices
            try {
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.YEAR, -1) // Look back 1 year
                val events = usageStatsManager.queryEvents(calendar.timeInMillis, endTime)
                var lastTimeUsed = 0L
                
                while (events.hasNextEvent()) {
                    val event = android.app.usage.UsageEvents.Event()
                    events.getNextEvent(event)
                    
                    if (event.packageName == packageName) {
                        // Track the most recent event
                        if (event.timeStamp > lastTimeUsed) {
                            lastTimeUsed = event.timeStamp
                        }
                    }
                }
                
                if (lastTimeUsed > 0) {
                    Log.d("InstalledAppsModule", "Found usage via events API for $packageName: lastTimeUsed=$lastTimeUsed")
                    return lastTimeUsed
                }
            } catch (e: Exception) {
                Log.w("InstalledAppsModule", "Error querying events for $packageName", e)
            }

            Log.d("InstalledAppsModule", "No usage data found for $packageName")
            return 0L
        } catch (e: Exception) {
            Log.e("InstalledAppsModule", "Error getting usage stats for $packageName", e)
            0L
        }
    }

    private fun getUsageStatsDetailed(packageName: String): Triple<Long, Long, Int> {
        return try {
            if (!hasUsageStatsPermissionInternal()) {
                return Triple(0L, 0L, 0)
            }

            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val endTime = System.currentTimeMillis()
            
            var lastTimeUsed = 0L
            var totalTimeInForeground = 0L
            var launchCount = 0
            
            // Try multiple time ranges to find usage data
            val timeRanges = arrayOf(365, 180, 90, 30, 7) // days
            
            for (days in timeRanges) {
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.DAY_OF_YEAR, -days)
                val startTime = calendar.timeInMillis
                
                // Try different intervals
                val intervals = arrayOf(
                    UsageStatsManager.INTERVAL_BEST,
                    UsageStatsManager.INTERVAL_DAILY,
                    UsageStatsManager.INTERVAL_WEEKLY
                )
                
                for (interval in intervals) {
                    try {
                        val usageStatsList = usageStatsManager.queryUsageStats(interval, startTime, endTime)
                        
                        if (usageStatsList != null && usageStatsList.isNotEmpty()) {
                            // Aggregate usage stats for this package
                            val relevantStats = usageStatsList.filter { it.packageName == packageName }
                            
                            if (relevantStats.isNotEmpty()) {
                                // Get the most recent lastTimeUsed
                                lastTimeUsed = relevantStats.maxOfOrNull { it.lastTimeUsed } ?: 0L
                                
                                // Sum up total time in foreground
                                totalTimeInForeground = relevantStats.sumOf { it.totalTimeInForeground }
                                
                                // If we found valid data, break out of interval loop
                                if (lastTimeUsed > 0) {
                                    break
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("InstalledAppsModule", "Error querying detailed stats with interval $interval for $days days", e)
                        continue
                    }
                }
                
                // If we found lastTimeUsed, now get launch count from events
                if (lastTimeUsed > 0) {
                    try {
                        // Query events for the same period
                        val events = usageStatsManager.queryEvents(startTime, endTime)
                        while (events.hasNextEvent()) {
                            val event = android.app.usage.UsageEvents.Event()
                            events.getNextEvent(event)
                            if (event.packageName == packageName && 
                                event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                                launchCount++
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("InstalledAppsModule", "Error counting launches for $packageName", e)
                    }
                    
                    Log.d("InstalledAppsModule", "Detailed stats for $packageName: lastTimeUsed=$lastTimeUsed, foreground=$totalTimeInForeground, launches=$launchCount")
                    return Triple(lastTimeUsed, totalTimeInForeground, launchCount)
                }
            }
            
            // Last resort: try events API directly
            if (lastTimeUsed == 0L) {
                try {
                    val calendar = Calendar.getInstance()
                    calendar.add(Calendar.YEAR, -1)
                    val startTime = calendar.timeInMillis
                    val events = usageStatsManager.queryEvents(startTime, endTime)
                    
                    while (events.hasNextEvent()) {
                        val event = android.app.usage.UsageEvents.Event()
                        events.getNextEvent(event)
                        
                        if (event.packageName == packageName) {
                            if (event.timeStamp > lastTimeUsed) {
                                lastTimeUsed = event.timeStamp
                            }
                            
                            if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                                launchCount++
                            }
                        }
                    }
                    
                    if (lastTimeUsed > 0) {
                        Log.d("InstalledAppsModule", "Found usage via events for $packageName: lastTimeUsed=$lastTimeUsed, launches=$launchCount")
                        return Triple(lastTimeUsed, totalTimeInForeground, launchCount)
                    }
                } catch (e: Exception) {
                    Log.w("InstalledAppsModule", "Error querying events for detailed stats", e)
                }
            }
            
            Log.d("InstalledAppsModule", "No detailed usage data found for $packageName")
            Triple(0L, 0L, 0)
        } catch (e: Exception) {
            Log.e("InstalledAppsModule", "Error getting detailed usage stats for $packageName", e)
            Triple(0L, 0L, 0)
        }
    }

    private fun hasUsageStatsPermissionInternal(): Boolean {
        return try {
            val appOpsManager = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
            val mode = appOpsManager.checkOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
            mode == android.app.AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            false
        }
    }

    private fun drawableToBitmap(drawable: android.graphics.drawable.Drawable): android.graphics.Bitmap {
        if (drawable is android.graphics.drawable.BitmapDrawable) {
            return drawable.bitmap
        }

        val bitmap = android.graphics.Bitmap.createBitmap(
            drawable.intrinsicWidth.takeIf { it > 0 } ?: 96,
            drawable.intrinsicHeight.takeIf { it > 0 } ?: 96,
            android.graphics.Bitmap.Config.ARGB_8888
        )
        val canvas = android.graphics.Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun bitmapToBase64(bitmap: android.graphics.Bitmap): String {
        val byteArrayOutputStream = java.io.ByteArrayOutputStream()
        bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 80, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return "data:image/png;base64," + android.util.Base64.encodeToString(byteArray, android.util.Base64.DEFAULT)
    }

    private fun getNetworkUsageForApp(packageName: String): WritableMap {
        val networkData = WritableNativeMap()
        
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                // NetworkStatsManager not available before API 23
                networkData.putDouble("mobileRx", 0.0)
                networkData.putDouble("mobileTx", 0.0)
                networkData.putDouble("wifiRx", 0.0)
                networkData.putDouble("wifiTx", 0.0)
                networkData.putDouble("totalRx", 0.0)
                networkData.putDouble("totalTx", 0.0)
                return networkData
            }

            val networkStatsManager = reactApplicationContext.getSystemService(Context.NETWORK_STATS_SERVICE) as? NetworkStatsManager
            if (networkStatsManager == null) {
                networkData.putDouble("mobileRx", 0.0)
                networkData.putDouble("mobileTx", 0.0)
                networkData.putDouble("wifiRx", 0.0)
                networkData.putDouble("wifiTx", 0.0)
                networkData.putDouble("totalRx", 0.0)
                networkData.putDouble("totalTx", 0.0)
                return networkData
            }

            val packageManager = reactApplicationContext.packageManager
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            val uid = packageInfo.applicationInfo?.uid ?: return networkData

            // Get usage for the last 30 days
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.add(Calendar.DAY_OF_YEAR, -30)
            val startTime = calendar.timeInMillis

            var mobileRx = 0L
            var mobileTx = 0L
            var wifiRx = 0L
            var wifiTx = 0L

            try {
                // Mobile data usage
                val mobileNetworkStats = networkStatsManager.queryDetailsForUid(
                    ConnectivityManager.TYPE_MOBILE,
                    getSubscriberId(),
                    startTime,
                    endTime,
                    uid
                )

                while (mobileNetworkStats.hasNextBucket()) {
                    val bucket = NetworkStats.Bucket()
                    mobileNetworkStats.getNextBucket(bucket)
                    mobileRx += bucket.rxBytes
                    mobileTx += bucket.txBytes
                }
                mobileNetworkStats.close()
            } catch (e: Exception) {
                Log.w("InstalledAppsModule", "Could not get mobile stats for $packageName", e)
            }

            try {
                // WiFi data usage
                val wifiNetworkStats = networkStatsManager.queryDetailsForUid(
                    ConnectivityManager.TYPE_WIFI,
                    null,
                    startTime,
                    endTime,
                    uid
                )

                while (wifiNetworkStats.hasNextBucket()) {
                    val bucket = NetworkStats.Bucket()
                    wifiNetworkStats.getNextBucket(bucket)
                    wifiRx += bucket.rxBytes
                    wifiTx += bucket.txBytes
                }
                wifiNetworkStats.close()
            } catch (e: Exception) {
                Log.w("InstalledAppsModule", "Could not get WiFi stats for $packageName", e)
            }

            networkData.putDouble("mobileRx", mobileRx.toDouble())
            networkData.putDouble("mobileTx", mobileTx.toDouble())
            networkData.putDouble("wifiRx", wifiRx.toDouble())
            networkData.putDouble("wifiTx", wifiTx.toDouble())
            networkData.putDouble("totalRx", (mobileRx + wifiRx).toDouble())
            networkData.putDouble("totalTx", (mobileTx + wifiTx).toDouble())

        } catch (e: Exception) {
            Log.e("InstalledAppsModule", "Error getting network usage for $packageName", e)
            networkData.putDouble("mobileRx", 0.0)
            networkData.putDouble("mobileTx", 0.0)
            networkData.putDouble("wifiRx", 0.0)
            networkData.putDouble("wifiTx", 0.0)
            networkData.putDouble("totalRx", 0.0)
            networkData.putDouble("totalTx", 0.0)
        }

        return networkData
    }

    private fun getSubscriberId(): String? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Starting from Android 10, this method is restricted
                null
            } else {
                val telephonyManager = reactApplicationContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
                telephonyManager?.subscriberId
            }
        } catch (e: Exception) {
            Log.w("InstalledAppsModule", "Could not get subscriber ID", e)
            null
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOpsManager = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
            val mode = appOpsManager.checkOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
            promise.resolve(mode == android.app.AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", "Failed to check usage stats permission: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_ERROR", "Failed to request usage stats permission: ${e.message}", e)
        }
    }
}