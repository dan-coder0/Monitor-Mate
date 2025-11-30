import { generatePDF } from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

export class PDFReportService {

    static getDownloadsDirectory() {
        if (Platform.OS === 'android') {
            return RNFS.DownloadDirectoryPath;
        } else {
            return RNFS.DocumentDirectoryPath;
        }
    }
    static async requestStoragePermission() {
        if (Platform.OS !== 'android') {
            return true;
        }

        try {
            if (Platform.Version >= 33) {
                return true;
            }
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission Required',
                    message: 'This app needs access to save the PDF report to your Downloads folder.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission request error:', err);
            return false;
        }
    }
    static async generateReport(apps = []) {
        try {
            const hasPermission = await this.requestStoragePermission();
            if (!hasPermission && Platform.OS === 'android' && Platform.Version < 33) {
                throw new Error('Storage permission is required to generate PDF reports');
            }

            const reportData = await this.prepareReportData(apps);
            const htmlContent = this.generateHTMLContent(reportData);
            const downloadsPath = this.getDownloadsDirectory();
            const fileName = `MobileMonitor_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            const options = {
                html: htmlContent,
                fileName: fileName,
                directory: downloadsPath,
                base64: false,
                width: 595,
                height: 842,
                padding: 40,
                bgColor: '#FFFFFF',
            };
            const file = await generatePDF(options);
            let finalPath = file.filePath;
            if (Platform.OS === 'android') {
                if (!finalPath.includes('/Download/')) {
                    const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
                    await RNFS.copyFile(finalPath, downloadPath);
                    finalPath = downloadPath;
                }
            }
            return {
                filePath: finalPath,
                numberOfPages: file.numberOfPages || 0,
                base64: file.base64 || '',
            };
        } catch (error) {
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    static async prepareReportData(apps) {
        const settingsData = await AsyncStorage.getItem('appSettings');
        const scanData = await AsyncStorage.getItem('scanResults');
        const settings = settingsData ? JSON.parse(settingsData) : {};
        const scanResults = scanData ? JSON.parse(scanData) : {};
        const stats = this.calculateStatistics(apps);
        const riskCategories = this.categorizeByRisk(apps);
        const topRiskyApps = this.getTopRiskyApps(apps, 10);
        const permissionAnalysis = this.analyzePermissions(apps);
        const dataUsageSummary = this.summarizeDataUsage(apps);
        return {
            generatedDate: new Date(),
            appVersion: '1.0.0',
            deviceInfo: {
                platform: Platform.OS,
                osVersion: Platform.Version,
            },
            settings,
            stats,
            riskCategories,
            topRiskyApps,
            permissionAnalysis,
            dataUsageSummary,
            apps,
            scanResults,
        };
    }

    static calculateStatistics(apps) {
        const totalApps = apps.length;

        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;
        let noRisk = 0;

        let totalPermissions = 0;
        let totalDataUsage = 0;

        apps.forEach(app => {
            const riskLevel = app.riskAnalysis?.riskLevel || 'NO_RISK';
            switch (riskLevel) {
                case 'HIGH_RISK':
                    highRisk++;
                    break;
                case 'MEDIUM_RISK':
                    mediumRisk++;
                    break;
                case 'LOW_RISK':
                    lowRisk++;
                    break;
                default:
                    noRisk++;
            }

            const uniquePermissions = [...new Set(app.permissions || [])];
            totalPermissions += uniquePermissions.length;

            totalDataUsage += (app.dataUsage?.total || 0);
        });

        return {
            totalApps,
            highRisk,
            mediumRisk,
            lowRisk,
            noRisk,
            riskPercentage: totalApps > 0 ? Math.round((highRisk / totalApps) * 100) : 0,
            averagePermissions: totalApps > 0 ? Math.round(totalPermissions / totalApps) : 0,
            totalDataUsage: this.formatBytes(totalDataUsage),
        };
    }

    static categorizeByRisk(apps) {
        return {
            highRisk: apps.filter(app => app.riskAnalysis?.riskLevel === 'HIGH_RISK'),
            mediumRisk: apps.filter(app => app.riskAnalysis?.riskLevel === 'MEDIUM_RISK'),
            lowRisk: apps.filter(app => app.riskAnalysis?.riskLevel === 'LOW_RISK'),
            noRisk: apps.filter(app => !app.riskAnalysis || app.riskAnalysis.riskLevel === 'NO_RISK'),
        };
    }

    static getTopRiskyApps(apps, limit = 10) {
        return apps
            .filter(app => app.riskAnalysis)
            .sort((a, b) => (b.riskAnalysis.riskScore || 0) - (a.riskAnalysis.riskScore || 0))
            .slice(0, limit);
    }


    static analyzePermissions(apps) {
        const permissionCount = {};
        const permissionByRisk = {
            HIGH: [],
            MEDIUM: [],
            LOW: [],
        };
        apps.forEach(app => {
            const uniquePermissions = [...new Set(app.permissions || [])];
            uniquePermissions.forEach(permission => {
                permissionCount[permission] = (permissionCount[permission] || 0) + 1;
            });
            if (app.riskAnalysis?.riskFactors) {
                app.riskAnalysis.riskFactors.forEach(factor => {
                    const riskLevel = factor.level;
                    if (!permissionByRisk[riskLevel].includes(factor.permission)) {
                        permissionByRisk[riskLevel].push(factor.permission);
                    }
                });
            }
        });
        const mostCommon = Object.entries(permissionCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([permission, count]) => ({ permission, count }));
        return {
            permissionCount,
            mostCommon,
            highRiskPermissions: permissionByRisk.HIGH.length,
            mediumRiskPermissions: permissionByRisk.MEDIUM.length,
            lowRiskPermissions: permissionByRisk.LOW.length,
        };
    }


    static summarizeDataUsage(apps) {
        let totalWifi = 0;
        let totalMobile = 0;
        const topDataConsumers = apps
            .filter(app => app.dataUsage && app.dataUsage.total > 0)
            .map(app => ({
                name: app.name || app.appName || 'Unknown',
                packageName: app.packageName,
                total: app.dataUsage.total,
                wifi: app.dataUsage.wifi || 0,
                mobile: app.dataUsage.mobile || 0,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        apps.forEach(app => {
            if (app.dataUsage) {
                totalWifi += app.dataUsage.wifi || 0;
                totalMobile += app.dataUsage.mobile || 0;
            }
        });
        return {
            totalWifi: this.formatBytes(totalWifi),
            totalMobile: this.formatBytes(totalMobile),
            totalCombined: this.formatBytes(totalWifi + totalMobile),
            topDataConsumers,
        };
    }

    static formatBytes(bytes) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }


    static generateHTMLContent(data) {
        const { generatedDate, appVersion, deviceInfo, stats,
                topRiskyApps, permissionAnalysis, dataUsageSummary, apps } = data;
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monitor Mate Security Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 11pt;
        }
        
        .page {
            width: 100%;
            padding: 40px;
            page-break-after: always;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #ff6347;
        }
        
        .logo {
            font-size: 28pt;
            font-weight: bold;
            color: #ff6347;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 24pt;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
        }
        
        .report-subtitle {
            font-size: 12pt;
            color: #666;
            margin-bottom: 10px;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 18pt;
            font-weight: bold;
            color: #ff6347;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ff6347;
        }
        
        .subsection-title {
            font-size: 14pt;
            font-weight: bold;
            color: #333;
            margin: 20px 0 10px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }
        
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #ff6347;
        }
        
        .info-label {
            font-size: 10pt;
            color: #666;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 14pt;
            font-weight: bold;
            color: #333;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            color: white;
        }
        
        .stat-card.high-risk {
            background: linear-gradient(135deg, #f93d66 0%, #d63447 100%);
        }
        
        .stat-card.medium-risk {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .stat-card.low-risk {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .stat-card.safe {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .stat-value {
            font-size: 32pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 10pt;
            opacity: 0.9;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }
        
        .table th {
            background: #ff6347;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .table tr:hover {
            background: #f3f4f6;
        }
        
        .risk-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .risk-high {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .risk-medium {
            background: #fef3c7;
            color: #92400e;
        }
        
        .risk-low {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .risk-none {
            background: #d1fae5;
            color: #065f46;
        }
        
        .permission-list {
            list-style: none;
            margin: 10px 0;
        }
        
        .permission-item {
            padding: 8px 12px;
            margin: 5px 0;
            background: #f8f9fa;
            border-left: 3px solid #ff6347;
            font-size: 10pt;
        }
        
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        
        .bar-chart {
            margin: 10px 0;
        }
        
        .bar-item {
            margin: 10px 0;
        }
        
        .bar-label {
            font-size: 10pt;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .bar {
            height: 24px;
            background: linear-gradient(90deg, #ff6347 0%, #ff8a73 100%);
            border-radius: 4px;
            position: relative;
        }
        
        .bar-value {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 10pt;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 9pt;
        }
        
        .recommendation {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
        }
        
        .recommendation-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .app-detail {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .app-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .app-name {
            font-size: 12pt;
            font-weight: bold;
            color: #333;
        }
        
        .app-package {
            font-size: 9pt;
            color: #666;
            font-family: monospace;
        }
        
        .summary-box {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .summary-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
        }
        
        .key-finding {
            padding: 10px 15px;
            margin: 8px 0;
            background: white;
            border-radius: 8px;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="page">
        <div class="header">
            <div class="logo">🛡️ Monitor Mate</div>
            <div class="report-title">Security & Privacy Report</div>
            <div class="report-subtitle">Comprehensive App Analysis</div>
        </div>
        
        <div class="info-grid" style="margin-top: 60px;">
            <div class="info-item">
                <div class="info-label">Report Generated</div>
                <div class="info-value">${generatedDate.toLocaleDateString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Report Time</div>
                <div class="info-value">${generatedDate.toLocaleTimeString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Platform</div>
                <div class="info-value">${deviceInfo.platform.toUpperCase()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">App Version</div>
                <div class="info-value">v${appVersion}</div>
            </div>
        </div>
        
        <div class="summary-box" style="margin-top: 60px;">
            <div class="summary-title">📊 Executive Summary</div>
            <div class="key-finding">
                <strong>Total Apps Analyzed:</strong> ${stats.totalApps} applications
            </div>
            <div class="key-finding">
                <strong>Security Status:</strong> ${stats.highRisk} high-risk apps detected (${stats.riskPercentage}% of total)
            </div>
            <div class="key-finding">
                <strong>Average Permissions:</strong> ${stats.averagePermissions} permissions per app
            </div>
            <div class="key-finding">
                <strong>Total Data Usage:</strong> ${stats.totalDataUsage}
            </div>
        </div>
        
        ${stats.highRisk > 0 ? `
        <div class="recommendation">
            <div class="recommendation-title">⚠️ Important Recommendation</div>
            <div>You have ${stats.highRisk} high-risk app${stats.highRisk > 1 ? 's' : ''} on your device. 
            We recommend reviewing their permissions and considering alternatives if they're not essential.</div>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Generated by Monitor Mate v${appVersion}</p>
            <p>This report contains confidential information about your device security</p>
        </div>
    </div>
    
    <!-- Statistics Overview Page -->
    <div class="page">
        <div class="section">
            <div class="section-title">📈 Security Overview</div>
            
            <div class="stats-grid">
                <div class="stat-card high-risk">
                    <div class="stat-value">${stats.highRisk}</div>
                    <div class="stat-label">High Risk</div>
                </div>
                <div class="stat-card medium-risk">
                    <div class="stat-value">${stats.mediumRisk}</div>
                    <div class="stat-label">Medium Risk</div>
                </div>
                <div class="stat-card low-risk">
                    <div class="stat-value">${stats.lowRisk}</div>
                    <div class="stat-label">Low Risk</div>
                </div>
                <div class="stat-card safe">
                    <div class="stat-value">${stats.noRisk}</div>
                    <div class="stat-label">Safe Apps</div>
                </div>
            </div>
            
            <div class="subsection-title">Risk Distribution</div>
            <div class="chart-container">
                <div class="bar-chart">
                    ${this.generateBarChart('High Risk', stats.highRisk, stats.totalApps, '#ef4444')}
                    ${this.generateBarChart('Medium Risk', stats.mediumRisk, stats.totalApps, '#f59e0b')}
                    ${this.generateBarChart('Low Risk', stats.lowRisk, stats.totalApps, '#3b82f6')}
                    ${this.generateBarChart('Safe', stats.noRisk, stats.totalApps, '#10b981')}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">🔐 Permission Analysis</div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">High Risk Permissions</div>
                    <div class="info-value">${permissionAnalysis.highRiskPermissions}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Medium Risk Permissions</div>
                    <div class="info-value">${permissionAnalysis.mediumRiskPermissions}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Average Permissions/App</div>
                    <div class="info-value">${stats.averagePermissions}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Unique Permissions</div>
                    <div class="info-value">${Object.keys(permissionAnalysis.permissionCount).length}</div>
                </div>
            </div>
            
            <div class="subsection-title">Most Common Permissions</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Permission</th>
                        <th>Apps Using</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${permissionAnalysis.mostCommon.map(p => `
                        <tr>
                            <td><strong>${p.permission}</strong></td>
                            <td>${p.count}</td>
                            <td>${Math.round((p.count / stats.totalApps) * 100)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- High Risk Apps Page -->
    ${topRiskyApps.length > 0 ? `
    <div class="page">
        <div class="section">
            <div class="section-title">⚠️ High Priority Apps</div>
            <p style="margin-bottom: 20px;">These apps have the highest security risk scores and should be reviewed carefully.</p>
            
            ${topRiskyApps.slice(0, 5).map((app, index) => `
                <div class="app-detail">
                    <div class="app-header">
                        <div>
                            <div class="app-name">${index + 1}. ${app.name || app.appName || 'Unknown App'}</div>
                            <div class="app-package">${app.packageName}</div>
                        </div>
                        <span class="risk-badge ${this.getRiskClass(app.riskAnalysis?.riskLevel)}">
                            ${app.riskAnalysis?.riskLevel || 'UNKNOWN'}
                        </span>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Risk Score</div>
                            <div class="info-value">${app.riskAnalysis?.riskScore || 0}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Permissions</div>
                            <div class="info-value">${[...new Set(app.permissions || [])].length}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">High Risk Permissions</div>
                            <div class="info-value">${app.riskAnalysis?.highRiskCount || 0}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Data Usage</div>
                            <div class="info-value">${this.formatBytes(app.dataUsage?.total || 0)}</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 9pt; color: #666; margin-top: 10px; font-style: italic;">
                        See detailed permission analysis in individual app pages below.
                    </p>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    <!-- Data Usage Page -->
    <div class="page">
        <div class="section">
            <div class="section-title">📊 Data Usage Analysis</div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Total WiFi Usage</div>
                    <div class="info-value">${dataUsageSummary.totalWifi}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Mobile Data</div>
                    <div class="info-value">${dataUsageSummary.totalMobile}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Combined Total</div>
                    <div class="info-value">${dataUsageSummary.totalCombined}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Apps with Data Usage</div>
                    <div class="info-value">${dataUsageSummary.topDataConsumers.length}</div>
                </div>
            </div>
            
            ${dataUsageSummary.topDataConsumers.length > 0 ? `
                <div class="subsection-title">Top Data Consumers</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>App Name</th>
                            <th>Total Usage</th>
                            <th>WiFi</th>
                            <th>Mobile</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataUsageSummary.topDataConsumers.map(app => `
                            <tr>
                                <td>
                                    <strong>${app.name}</strong><br>
                                    <small style="color: #666; font-family: monospace;">${app.packageName}</small>
                                </td>
                                <td><strong>${this.formatBytes(app.total)}</strong></td>
                                <td>${this.formatBytes(app.wifi)}</td>
                                <td>${this.formatBytes(app.mobile)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No data usage information available.</p>'}
        </div>
    </div>
    
    <!-- Complete App Inventory Page -->
    <div class="page">
        <div class="section">
            <div class="section-title">📱 Complete App Inventory</div>
            <p style="margin-bottom: 20px;">Complete list of all ${apps.length} analyzed applications (showing first 30)</p>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>App Name</th>
                        <th>Category</th>
                        <th>Risk Level</th>
                        <th>Permissions</th>
                    </tr>
                </thead>
                <tbody>
                    ${apps.slice(0, 30).map((app, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <strong>${this.escapeHtml(app.name || app.appName || 'Unknown')}</strong><br>
                                <small style="color: #666; font-size: 8pt;">${this.escapeHtml(app.packageName)}</small>
                            </td>
                            <td>${app.category || 'Other'}</td>
                            <td>
                                <span class="risk-badge ${this.getRiskClass(app.riskAnalysis?.riskLevel)}">
                                    ${app.riskAnalysis?.riskLevel?.replace('_RISK', '').replace('_', ' ') || 'SAFE'}
                                </span>
                            </td>
                            <td><strong>${[...new Set(app.permissions || [])].length}</strong></td>
                        </tr>
                    `).join('')}
                    ${apps.length > 30 ? `
                        <tr>
                            <td colspan="5" style="text-align: center; font-style: italic; color: #666;">
                                ... and ${apps.length - 30} more apps
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Detailed App Permissions Pages -->
    ${apps.slice(0, 10).filter(app => (app.permissions || []).length > 0).map((app, appIndex) => `
    <div class="page">
        <div class="section">
            <div class="section-title">📋 App Details: ${this.escapeHtml(app.name || app.appName || 'Unknown')}</div>
            
            <div class="app-detail" style="margin-bottom: 20px;">
                <div class="app-header">
                    <div>
                        <div class="app-name">${this.escapeHtml(app.name || app.appName || 'Unknown')}</div>
                        <div class="app-package">${this.escapeHtml(app.packageName)}</div>
                    </div>
                    <span class="risk-badge ${this.getRiskClass(app.riskAnalysis?.riskLevel)}">
                        ${app.riskAnalysis?.riskLevel?.replace('_RISK', '').replace('_', ' ') || 'SAFE'}
                    </span>
                </div>
                
                <div class="info-grid" style="margin-top: 15px;">
                    <div class="info-item">
                        <div class="info-label">Category</div>
                        <div class="info-value">${app.category || 'Other'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Risk Score</div>
                        <div class="info-value">${app.riskAnalysis?.riskScore || 0}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Permissions</div>
                        <div class="info-value">${[...new Set(app.permissions || [])].length}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">High Risk Perms</div>
                        <div class="info-value">${app.riskAnalysis?.highRiskCount || 0}</div>
                    </div>
                </div>
            </div>
            
            ${(app.permissions || []).length > 0 ? `
                <div class="subsection-title">All Permissions (${[...new Set(app.permissions || [])].length})</div>
                <table class="table" style="font-size: 9pt;">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 35%;">Permission</th>
                            <th style="width: 15%;">Risk Level</th>
                            <th style="width: 45%;">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...new Set(app.permissions || [])].map((perm, permIndex) => {
                            const permInfo = this.getPermissionInfo(perm);
                            return `
                            <tr>
                                <td>${permIndex + 1}</td>
                                <td><strong>${this.escapeHtml(perm)}</strong></td>
                                <td>
                                    <span class="risk-badge ${this.getRiskBadgeClass(permInfo.level)}">
                                        ${permInfo.level || 'LOW'}
                                    </span>
                                </td>
                                <td style="font-size: 8pt;">${this.escapeHtml(permInfo.description)}</td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            ` : '<p style="color: #666;">No permissions requested by this app.</p>'}
            
            ${app.dataUsage && app.dataUsage.total > 0 ? `
                <div class="subsection-title" style="margin-top: 20px;">Data Usage</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Total Usage</div>
                        <div class="info-value">${this.formatBytes(app.dataUsage.total)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">WiFi</div>
                        <div class="info-value">${this.formatBytes(app.dataUsage.wifi || 0)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Mobile Data</div>
                        <div class="info-value">${this.formatBytes(app.dataUsage.mobile || 0)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Usage Rank</div>
                        <div class="info-value">#${appIndex + 1}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    </div>
    `).join('')}
    
    <!-- Recommendations Page -->
    <div class="page">
        <div class="section">
            <div class="section-title">💡 Security Recommendations</div>
            
            ${stats.highRisk > 0 ? `
                <div class="recommendation">
                    <div class="recommendation-title">🔴 Critical: Review High-Risk Apps</div>
                    <div>You have ${stats.highRisk} high-risk app${stats.highRisk > 1 ? 's' : ''} installed. 
                    Review their permissions in device settings and consider if they're essential. 
                    Look for alternative apps with fewer permission requirements.</div>
                </div>
            ` : ''}
            
            ${stats.averagePermissions > 10 ? `
                <div class="recommendation">
                    <div class="recommendation-title">🟡 Warning: High Permission Usage</div>
                    <div>Your apps request an average of ${stats.averagePermissions} permissions, which is above normal. 
                    Review which permissions are truly necessary and revoke unused ones in your device settings.</div>
                </div>
            ` : ''}
            
            ${permissionAnalysis.highRiskPermissions > 5 ? `
                <div class="recommendation">
                    <div class="recommendation-title">🟡 Caution: Multiple Sensitive Permissions</div>
                    <div>${permissionAnalysis.highRiskPermissions} apps have access to sensitive permissions like Camera, 
                    Microphone, or Location. Regularly audit which apps need these permissions and revoke access 
                    for apps that don't actively use them.</div>
                </div>
            ` : ''}
            
            <div class="recommendation">
                <div class="recommendation-title">✅ Best Practices</div>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li style="margin: 8px 0;">Regularly review and uninstall apps you no longer use</li>
                    <li style="margin: 8px 0;">Check app permissions before installing new applications</li>
                    <li style="margin: 8px 0;">Keep all apps updated to the latest versions</li>
                    <li style="margin: 8px 0;">Use Monitor Mate weekly to track new security issues</li>
                    <li style="margin: 8px 0;">Review app permissions in device settings monthly</li>
                </ul>
            </div>
            
            <div class="summary-box" style="margin-top: 40px;">
                <div class="summary-title">📋 Report Summary</div>
                <div class="key-finding">
                    This comprehensive security report analyzed ${stats.totalApps} applications on your ${deviceInfo.platform.toUpperCase()} device.
                </div>
                <div class="key-finding">
                    Overall Security Status: ${stats.highRisk === 0 ? '✅ Good - No high-risk apps detected' :
                    stats.highRisk <= 2 ? '⚠️ Fair - Some concerns to address' :
                    '🔴 Needs Attention - Multiple high-risk apps'}
                </div>
                <div class="key-finding">
                    Next Steps: ${stats.highRisk > 0 ? 'Review high-risk apps immediately' : 'Continue monitoring regularly'}
                </div>
            </div>
        </div>
        
        <div class="footer" style="margin-top: 60px;">
            <p><strong>Monitor Mate Security Report</strong></p>
            <p>Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}</p>
            <p>Report Version: ${appVersion} | Platform: ${deviceInfo.platform.toUpperCase()}</p>
            <p style="margin-top: 15px; font-size: 8pt;">
                This report is confidential and contains sensitive information about your device security.<br>
                Keep this document secure and do not share with unauthorized parties.
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }


    static generateBarChart(label, value, max, color) {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        return `
            <div class="bar-item">
                <div class="bar-label">${label}</div>
                <div class="bar" style="width: ${percentage}%; background: ${color};">
                    <div class="bar-value">${value}</div>
                </div>
            </div>
        `;
    }

    static getRiskClass(riskLevel) {
        switch (riskLevel) {
            case 'HIGH_RISK':
                return 'risk-high';
            case 'MEDIUM_RISK':
                return 'risk-medium';
            case 'LOW_RISK':
                return 'risk-low';
            default:
                return 'risk-none';
        }
    }


    static getRiskBadgeClass(level) {
        switch (level) {
            case 'HIGH':
                return 'risk-high';
            case 'MEDIUM':
                return 'risk-medium';
            case 'LOW':
                return 'risk-low';
            default:
                return 'risk-none';
        }
    }


    static getPermissionInfo(permission) {
        const permissionMap = {
            'CAMERA': { level: 'HIGH', description: 'Can take photos and videos without your knowledge' },
            'LOCATION': { level: 'HIGH', description: 'Can track your location and movement patterns' },
            'MICROPHONE': { level: 'HIGH', description: 'Can record audio and conversations' },
            'CONTACTS': { level: 'HIGH', description: 'Can access your personal contacts and relationships' },
            'PHONE': { level: 'HIGH', description: 'Can access phone numbers and call information' },
            'SMS': { level: 'HIGH', description: 'Can read and send text messages' },
            'CALL_LOG': { level: 'HIGH', description: 'Can access call history and phone logs' },
            'PHONE_NUMBERS': { level: 'HIGH', description: 'Can access device phone numbers' },
            'CALL_CONTROL': { level: 'HIGH', description: 'Can answer incoming calls' },
            'CALL_MONITORING': { level: 'HIGH', description: 'Can monitor and control outgoing calls' },
            'BACKGROUND_LOCATION': { level: 'HIGH', description: 'Can track your location even when app is closed' },
            'HEALTH_DATA': { level: 'HIGH', description: 'Can access health and fitness data' },
            'FILE_MANAGER': { level: 'HIGH', description: 'Can access all files on your device storage' },
            'STORAGE': { level: 'MEDIUM', description: 'Can access files and photos on your device' },
            'PHOTOS': { level: 'MEDIUM', description: 'Can access photos and images on your device' },
            'VIDEOS': { level: 'MEDIUM', description: 'Can access videos on your device' },
            'MUSIC': { level: 'MEDIUM', description: 'Can access audio files and music on your device' },
            'MEDIA_LOCATION': { level: 'MEDIUM', description: 'Can access location information from photos and videos' },
            'CALENDAR': { level: 'MEDIUM', description: 'Can view and modify your calendar events' },
            'SENSORS': { level: 'MEDIUM', description: 'Can access body sensors and health data' },
            'USAGE_ACCESS': { level: 'MEDIUM', description: 'Can access app usage statistics and screen time data' },
            'ACTIVITY_RECOGNITION': { level: 'MEDIUM', description: 'Can access physical activity and step tracking' },
            'BLUETOOTH': { level: 'MEDIUM', description: 'Can access nearby Bluetooth devices' },
            'NEARBY_DEVICES': { level: 'MEDIUM', description: 'Can access nearby Wi-Fi and Bluetooth devices' },
            'ACCOUNTS': { level: 'MEDIUM', description: 'Can access accounts on the device' },
            'VOIP': { level: 'MEDIUM', description: 'Can make and receive internet calls (VoIP)' },
            'SENSORS_BACKGROUND': { level: 'MEDIUM', description: 'Can access body sensors in the background' },
            'UWB': { level: 'MEDIUM', description: 'Can use precise device positioning using ultra-wideband' },
            'NOTIFICATIONS': { level: 'LOW', description: 'Can show notifications on your device' },
            'INTERNET': { level: 'LOW', description: 'Can access the internet' },
            'NETWORK_STATE': { level: 'LOW', description: 'Can view network connections' },
            'WIFI_STATE': { level: 'LOW', description: 'Can view Wi-Fi connections' },
            'VIBRATE': { level: 'LOW', description: 'Can control vibration' },
            'WAKE_LOCK': { level: 'LOW', description: 'Can prevent phone from sleeping' },
            'FOREGROUND_SERVICE': { level: 'LOW', description: 'Can run in the foreground' },
            'RECEIVE_BOOT_COMPLETED': { level: 'LOW', description: 'Can start on device boot' },
        };

        return permissionMap[permission] || {
            level: 'LOW',
            description: 'System permission with low risk',
        };
    }


    static escapeHtml(text) {
        if (!text) {
            return '';
        }
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }
}

export default PDFReportService;