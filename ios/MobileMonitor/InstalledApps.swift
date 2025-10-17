import Foundation
import UIKit

@objc(InstalledApps)
class InstalledApps: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func getInstalledApps(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Note: iOS doesn't allow apps to enumerate other installed apps for privacy reasons
        // We can only provide information about the current app and some system information
        
        DispatchQueue.global(qos: .background).async {
            let apps = NSMutableArray()
            
            // Add current app information
            if let currentAppInfo = self.getCurrentAppInfo() {
                apps.add(currentAppInfo)
            }
            
            // Add some system app placeholders that we know exist on iOS
            let systemApps = self.getKnownSystemApps()
            for app in systemApps {
                apps.add(app)
            }
            
            DispatchQueue.main.async {
                resolve(apps)
            }
        }
    }
    
    @objc
    func getAppDetails(_ packageName: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.global(qos: .background).async {
            // Check if this is the current app
            if let bundleId = Bundle.main.bundleIdentifier, bundleId == packageName {
                if let appInfo = self.getCurrentAppInfo() {
                    DispatchQueue.main.async {
                        resolve(appInfo)
                    }
                    return
                }
            }
            
            // For other apps, we can only provide limited information
            let limitedInfo = self.getLimitedAppInfo(for: packageName)
            
            DispatchQueue.main.async {
                if let info = limitedInfo {
                    resolve(info)
                } else {
                    reject("APP_NOT_FOUND", "App information not available on iOS", nil)
                }
            }
        }
    }
    
    @objc
    func getNetworkUsage(_ packageName: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // iOS doesn't provide per-app network usage statistics to third-party apps
        let networkData: [String: Any] = [
            "mobileRx": 0,
            "mobileTx": 0,
            "wifiRx": 0,
            "wifiTx": 0,
            "totalRx": 0,
            "totalTx": 0,
            "note": "iOS does not provide per-app network statistics to third-party apps"
        ]
        
        resolve(networkData)
    }
    
    @objc
    func hasUsageStatsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // iOS doesn't have usage stats permission like Android
        resolve(false)
    }
    
    @objc
    func requestUsageStatsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // iOS doesn't allow requesting usage stats permission
        resolve(false)
    }
    
    // MARK: - Private Methods
    
    private func getCurrentAppInfo() -> [String: Any]? {
        guard let bundle = Bundle.main.infoDictionary,
              let bundleId = Bundle.main.bundleIdentifier,
              let appName = bundle["CFBundleDisplayName"] as? String ?? bundle["CFBundleName"] as? String else {
            return nil
        }
        
        let version = bundle["CFBundleShortVersionString"] as? String ?? "Unknown"
        let buildNumber = bundle["CFBundleVersion"] as? String ?? "Unknown"
        
        // Get app icon
        var iconBase64: String? = nil
        if let iconName = self.getAppIconName() {
            iconBase64 = self.getIconAsBase64(iconName: iconName)
        }
        
        // Get app size (approximate)
        let appSize = self.getAppSize()
        
        // Get permissions (from Info.plist usage descriptions)
        let permissions = self.getAppPermissions()
        
        let appInfo: [String: Any] = [
            "bundleId": bundleId,
            "packageName": bundleId, // For compatibility with Android
            "appName": appName,
            "versionName": version,
            "versionCode": buildNumber,
            "firstInstallTime": 0, // Not available on iOS
            "lastUpdateTime": self.getAppInstallDate(),
            "lastTimeUsed": Date().timeIntervalSince1970 * 1000, // Current time
            "totalTimeInForeground": 0, // Not easily available on iOS
            "launchCount": 0, // Not available on iOS
            "size": appSize,
            "icon": iconBase64 ?? "default",
            "permissions": permissions,
            "platform": "ios"
        ]
        
        return appInfo
    }
    
    private func getKnownSystemApps() -> [[String: Any]] {
        // Return information about known system apps that we can safely assume exist
        let systemApps: [[String: Any]] = [
            [
                "bundleId": "com.apple.mobilemail",
                "packageName": "com.apple.mobilemail",
                "appName": "Mail",
                "versionName": "Unknown",
                "versionCode": "Unknown",
                "firstInstallTime": 0,
                "lastUpdateTime": 0,
                "lastTimeUsed": 0,
                "totalTimeInForeground": 0,
                "launchCount": 0,
                "size": 0,
                "icon": "default",
                "permissions": ["CONTACTS", "CALENDAR"],
                "platform": "ios",
                "note": "System app - limited information available"
            ],
            [
                "bundleId": "com.apple.mobilesafari",
                "packageName": "com.apple.mobilesafari",
                "appName": "Safari",
                "versionName": "Unknown",
                "versionCode": "Unknown",
                "firstInstallTime": 0,
                "lastUpdateTime": 0,
                "lastTimeUsed": 0,
                "totalTimeInForeground": 0,
                "launchCount": 0,
                "size": 0,
                "icon": "default",
                "permissions": ["CAMERA", "LOCATION", "MICROPHONE"],
                "platform": "ios",
                "note": "System app - limited information available"
            ],
            [
                "bundleId": "com.apple.camera",
                "packageName": "com.apple.camera",
                "appName": "Camera",
                "versionName": "Unknown",
                "versionCode": "Unknown",
                "firstInstallTime": 0,
                "lastUpdateTime": 0,
                "lastTimeUsed": 0,
                "totalTimeInForeground": 0,
                "launchCount": 0,
                "size": 0,
                "icon": "default",
                "permissions": ["CAMERA", "MICROPHONE", "LOCATION"],
                "platform": "ios",
                "note": "System app - limited information available"
            ]
        ]
        
        return systemApps
    }
    
    private func getLimitedAppInfo(for bundleId: String) -> [String: Any]? {
        // For apps other than the current app, we can only provide very limited information
        // Check if we can open the app (indicates it's installed)
        if let url = URL(string: "\(bundleId)://"), UIApplication.shared.canOpenURL(url) {
            return [
                "bundleId": bundleId,
                "packageName": bundleId,
                "appName": "Unknown App",
                "versionName": "Unknown",
                "versionCode": "Unknown",
                "firstInstallTime": 0,
                "lastUpdateTime": 0,
                "lastTimeUsed": 0,
                "totalTimeInForeground": 0,
                "launchCount": 0,
                "size": 0,
                "icon": "default",
                "permissions": [],
                "platform": "ios",
                "note": "Limited information available due to iOS privacy restrictions"
            ]
        }
        
        return nil
    }
    
    private func getAppIconName() -> String? {
        guard let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
              let primaryIcon = icons["CFBundlePrimaryIcon"] as? [String: Any],
              let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String],
              let iconName = iconFiles.last else {
            return nil
        }
        return iconName
    }
    
    private func getIconAsBase64(iconName: String) -> String? {
        guard let image = UIImage(named: iconName),
              let imageData = image.pngData() else {
            return nil
        }
        
        return "data:image/png;base64," + imageData.base64EncodedString()
    }
    
    private func getAppSize() -> Double {
        // Get approximate app size by checking the main bundle
        var totalSize: Double = 0
        
        if let bundlePath = Bundle.main.bundlePath {
            totalSize = self.calculateDirectorySize(at: bundlePath)
        }
        
        // Also try to get documents directory size
        if let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first {
            totalSize += self.calculateDirectorySize(at: documentsPath)
        }
        
        return totalSize
    }
    
    private func calculateDirectorySize(at path: String) -> Double {
        let fileManager = FileManager.default
        var totalSize: Double = 0
        
        if let enumerator = fileManager.enumerator(atPath: path) {
            for case let fileName as String in enumerator {
                let filePath = (path as NSString).appendingPathComponent(fileName)
                do {
                    let attributes = try fileManager.attributesOfItem(atPath: filePath)
                    if let fileSize = attributes[.size] as? Double {
                        totalSize += fileSize
                    }
                } catch {
                    // Skip files we can't access
                    continue
                }
            }
        }
        
        return totalSize
    }
    
    private func getAppInstallDate() -> Double {
        // Try to get the app's install date from the bundle
        if let bundlePath = Bundle.main.bundlePath {
            do {
                let attributes = try FileManager.default.attributesOfItem(atPath: bundlePath)
                if let creationDate = attributes[.creationDate] as? Date {
                    return creationDate.timeIntervalSince1970 * 1000
                }
            } catch {
                // Fallback to current time
            }
        }
        
        return Date().timeIntervalSince1970 * 1000
    }
    
    private func getAppPermissions() -> [String] {
        var permissions: [String] = []
        
        guard let infoPlist = Bundle.main.infoDictionary else {
            return permissions
        }
        
        // Check for common permission usage descriptions
        let permissionKeys: [String: String] = [
            "NSCameraUsageDescription": "CAMERA",
            "NSMicrophoneUsageDescription": "MICROPHONE",
            "NSLocationWhenInUseUsageDescription": "LOCATION",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "LOCATION",
            "NSContactsUsageDescription": "CONTACTS",
            "NSCalendarsUsageDescription": "CALENDAR",
            "NSPhotoLibraryUsageDescription": "STORAGE",
            "NSMotionUsageDescription": "SENSORS",
            "NSHealthShareUsageDescription": "SENSORS",
            "NSHealthUpdateUsageDescription": "SENSORS"
        ]
        
        for (key, permission) in permissionKeys {
            if infoPlist[key] != nil && !permissions.contains(permission) {
                permissions.append(permission)
            }
        }
        
        return permissions
    }
}