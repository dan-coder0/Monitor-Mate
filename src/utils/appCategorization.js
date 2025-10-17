// src/utils/appCategorization.js

/**
 * App categorization utility for classifying apps based on package names and other metadata
 */

// Category constants
export const APP_CATEGORIES = {
    SOCIAL: 'Social',
    COMMUNICATION: 'Communication',
    ENTERTAINMENT: 'Entertainment',
    PRODUCTIVITY: 'Productivity',
    SHOPPING: 'Shopping',
    FINANCE: 'Finance',
    HEALTH_FITNESS: 'Health & Fitness',
    EDUCATION: 'Education',
    NEWS: 'News',
    TRAVEL: 'Travel',
    FOOD_DRINK: 'Food & Drink',
    PHOTO_VIDEO: 'Photo & Video',
    MUSIC: 'Music',
    GAMES: 'Games',
    UTILITIES: 'Utilities',
    BUSINESS: 'Business',
    LIFESTYLE: 'Lifestyle',
    WEATHER: 'Weather',
    SPORTS: 'Sports',
    BOOKS: 'Books',
    MEDICAL: 'Medical',
    NAVIGATION: 'Navigation',
    SYSTEM: 'System',
    OTHER: 'Other'
};

// App classification data
const APP_CLASSIFICATION = {
    [APP_CATEGORIES.SOCIAL]: {
        packageNames: [
            'com.facebook.katana',
            'com.facebook.lite',
            'com.instagram.android',
            'com.twitter.android',
            'com.snapchat.android',
            'com.zhiliaoapp.musically', // TikTok
            'com.linkedin.android',
            'com.pinterest',
            'com.reddit.frontpage',
            'com.tumblr',
            'com.discord',
            'com.vk.im',
            'com.sina.weibo',
            'com.tencent.mm', // WeChat
            'jp.naver.line.android',
            'com.clubhouseapp',
            'com.twitter.android.lite',
            'com.facebook.mlite'
        ],
        keywords: [
            'facebook', 'instagram', 'twitter', 'snapchat', 'tiktok',
            'linkedin', 'pinterest', 'reddit', 'tumblr', 'discord',
            'social', 'chat', 'messenger', 'community', 'network'
        ]
    },

    [APP_CATEGORIES.COMMUNICATION]: {
        packageNames: [
            'com.whatsapp',
            'com.whatsapp.w4b', // WhatsApp Business
            'org.telegram.messenger',
            'org.telegram.plus',
            'com.viber.voip',
            'com.skype.raider',
            'us.zoom.videomeetings',
            'com.microsoft.teams',
            'com.google.android.apps.tachyon', // Google Duo
            'com.google.android.talk', // Hangouts
            'com.facebook.orca', // Messenger
            'com.facebook.mlite', // Messenger Lite
            'com.imo.android.imoim',
            'kik.android',
            'com.textnow.wrapper',
            'com.wire',
            'com.threema.app',
            'com.signal.android'
        ],
        keywords: [
            'whatsapp', 'telegram', 'messenger', 'viber', 'skype',
            'zoom', 'teams', 'duo', 'hangouts', 'chat', 'call',
            'video', 'voice', 'communication', 'meeting'
        ]
    },

    [APP_CATEGORIES.ENTERTAINMENT]: {
        packageNames: [
            'com.netflix.mediaclient',
            'com.amazon.avod.thirdpartyclient', // Prime Video
            'com.disney.disneyplus',
            'com.hulu.plus',
            'com.hbo.hbonow',
            'com.google.android.youtube',
            'com.google.android.apps.youtube.music',
            'com.google.android.youtube.tv',
            'com.amazon.amazonvideo.livingroom',
            'tv.twitch.android.app',
            'com.crunchyroll.crunchyroid',
            'com.plexapp.android',
            'air.tv.douyu.android', // Douyu
            'tv.danmaku.bili', // Bilibili
            'com.ss.android.ugc.aweme' // TikTok alternative name
        ],
        keywords: [
            'netflix', 'prime', 'disney', 'hulu', 'hbo', 'youtube',
            'twitch', 'video', 'streaming', 'movie', 'tv', 'show',
            'entertainment', 'media', 'watch', 'player'
        ]
    },

    [APP_CATEGORIES.MUSIC]: {
        packageNames: [
            'com.spotify.music',
            'com.apple.android.music',
            'com.amazon.mp3',
            'com.google.android.music',
            'com.pandora.android',
            'fm.last.android',
            'com.soundcloud.android',
            'com.shazam.android',
            'deezer.android.app',
            'com.aspiro.tidal',
            'com.clearchannel.iheartradio.controller',
            'tunein.player',
            'com.audible.application',
            'com.bambuna.podcastaddict',
            'au.com.shiftyjelly.pocketcasts'
        ],
        keywords: [
            'spotify', 'music', 'audio', 'song', 'playlist', 'radio',
            'podcast', 'sound', 'player', 'streaming', 'tune'
        ]
    },

    [APP_CATEGORIES.PRODUCTIVITY]: {
        packageNames: [
            'com.google.android.gm', // Gmail
            'com.microsoft.office.outlook',
            'com.google.android.apps.docs.editors.docs', // Google Docs
            'com.google.android.apps.docs.editors.sheets', // Google Sheets  
            'com.google.android.apps.docs.editors.slides', // Google Slides
            'com.microsoft.office.word',
            'com.microsoft.office.excel',
            'com.microsoft.office.powerpoint',
            'com.dropbox.android',
            'com.google.android.apps.docs', // Google Drive
            'com.microsoft.skydrive', // OneDrive
            'com.evernote',
            'com.todoist',
            'com.any.do',
            'com.trello',
            'com.asana.app',
            'com.slack',
            'com.notion.id',
            'com.adobe.reader'
        ],
        keywords: [
            'office', 'document', 'word', 'excel', 'powerpoint',
            'gmail', 'email', 'drive', 'dropbox', 'cloud',
            'productivity', 'work', 'task', 'note', 'calendar'
        ]
    },

    [APP_CATEGORIES.GAMES]: {
        packageNames: [
            'com.king.candycrushsaga',
            'com.supercell.clashofclans',
            'com.supercell.clashroyale',
            'com.supercell.boombeach',
            'com.supercell.hayday',
            'com.miHoYo.GenshinImpact',
            'com.roblox.client',
            'com.ea.games.fifa_mobile',
            'com.nianticlabs.pokemongo',
            'com.activision.callofduty.shooter',
            'com.pubg.imobile',
            'com.garena.game.fctw', // Free Fire
            'com.mojang.minecraftpe',
            'com.epicgames.fortnite',
            'com.gameloft.android.ANMP.GloftA8HM', // Asphalt 8
            'com.rovio.angrybirds'
        ],
        keywords: [
            'game', 'play', 'gaming', 'clash', 'candy', 'minecraft',
            'pokemon', 'pubg', 'fortnite', 'mobile', 'arcade',
            'puzzle', 'strategy', 'action', 'adventure', 'simulation'
        ]
    },

    [APP_CATEGORIES.SHOPPING]: {
        packageNames: [
            'com.amazon.mShop.android.shopping',
            'com.ebay.mobile',
            'com.contextlogic.wish',
            'com.alibaba.aliexpresshd',
            'com.etsy.android',
            'com.walmart.android',
            'com.target.ui',
            'com.zappos.android',
            'com.booking',
            'com.airbnb.android',
            'com.ubercab',
            'com.lyft',
            'com.doordash.app',
            'com.grubhub.android',
            'com.ubereats'
        ],
        keywords: [
            'shop', 'buy', 'store', 'market', 'retail', 'commerce',
            'amazon', 'ebay', 'wish', 'shopping', 'purchase', 'order'
        ]
    },

    [APP_CATEGORIES.FINANCE]: {
        packageNames: [
            'com.paypal.android.p2pmobile',
            'com.venmo',
            'com.square.cash', // Cash App
            'com.coinbase.android',
            'com.robinhood.android',
            'com.chase.sig.android',
            'com.bankofamerica.digitalwallet',
            'com.wellsfargo.mobile.android',
            'com.usaa.mobile.android.usaa',
            'com.mint',
            'personal.finance.app', // Personal Capital
            'com.americanexpress.android.acctsvcs.us'
        ],
        keywords: [
            'bank', 'finance', 'money', 'pay', 'wallet', 'credit',
            'debit', 'loan', 'investment', 'trading', 'budget'
        ]
    },

    [APP_CATEGORIES.HEALTH_FITNESS]: {
        packageNames: [
            'com.fitbit.FitbitMobile',
            'com.myfitnesspal.android',
            'com.nike.plusone', // Nike Run Club
            'com.strava',
            'com.google.android.apps.fitness',
            'com.samsung.shealth',
            'com.apple.Health',
            'com.endomondo.android',
            'com.runtastic.android',
            'com.calm.android',
            'com.headspace.android',
            'com.fatsecret.android'
        ],
        keywords: [
            'health', 'fitness', 'workout', 'exercise', 'run',
            'step', 'calorie', 'weight', 'diet', 'meditation',
            'sleep', 'wellness', 'tracker'
        ]
    },

    [APP_CATEGORIES.PHOTO_VIDEO]: {
        packageNames: [
            'com.google.android.apps.photos',
            'com.adobe.lrmobile',
            'com.vsco.cam',
            'com.camerasideas.instashot',
            'com.nexstreaming.app.kinemasterfree',
            'com.adobe.photoshopmix',
            'com.canva.editor',
            'com.picsart.studio',
            'com.niksoftware.snapseed',
            'flipagram.android', // Vigo Video
            'com.faceu.alishanghalf' // SNOW
        ],
        keywords: [
            'photo', 'camera', 'image', 'picture', 'edit',
            'filter', 'video', 'record', 'capture', 'gallery'
        ]
    },

    [APP_CATEGORIES.NAVIGATION]: {
        packageNames: [
            'com.google.android.apps.maps',
            'com.waze',
            'com.apple.Maps',
            'com.here.app.maps',
            'com.mapquest.android.ace',
            'com.sygic.aura',
            'com.garmin.android.apps.navigon'
        ],
        keywords: [
            'maps', 'navigation', 'gps', 'direction', 'route',
            'location', 'travel', 'drive', 'traffic'
        ]
    },

    [APP_CATEGORIES.NEWS]: {
        packageNames: [
            'com.google.android.apps.magazines',
            'flipboard.app',
            'com.cnn.mobile.android.phone',
            'com.foxnews.android',
            'com.nytimes.android',
            'com.washingtonpost.rainbow',
            'com.bbcnews.v2',
            'com.reuters.android',
            'com.linkedin.android.pulse'
        ],
        keywords: [
            'news', 'media', 'article', 'paper', 'journal',
            'press', 'report', 'current', 'events', 'breaking'
        ]
    },

    [APP_CATEGORIES.WEATHER]: {
        packageNames: [
            'com.weather.Weather',
            'com.accuweather.android',
            'com.weather.underground.android',
            'com.weatherbug.android',
            'com.yahoo.mobile.client.android.weather'
        ],
        keywords: [
            'weather', 'forecast', 'temperature', 'rain',
            'storm', 'climate', 'humidity', 'wind'
        ]
    },

    [APP_CATEGORIES.UTILITIES]: {
        packageNames: [
            'com.cleanmaster.mguard',
            'com.iobit.mobilecare',
            'com.cleanmaster.security',
            'com.antivirus',
            'com.speedtest.android',
            'com.farproc.wifi.analyzer',
            'com.google.android.keep',
            'com.estrongs.android.pop',
            'com.flashlight'
        ],
        keywords: [
            'utility', 'tool', 'cleaner', 'optimizer', 'battery',
            'security', 'antivirus', 'scanner', 'flashlight',
            'calculator', 'converter', 'manager'
        ]
    },

    [APP_CATEGORIES.SYSTEM]: {
        packageNames: [
            'com.android.vending', // Google Play Store
            'com.android.settings',
            'com.google.android.gms',
            'com.android.systemui',
            'com.google.android.webview',
            'com.android.chrome',
            'com.sec.android.app.launcher', // Samsung Launcher
            'com.miui.home', // Xiaomi Launcher
            'com.huawei.android.launcher'
        ],
        keywords: [
            'system', 'android', 'google', 'launcher', 'setting',
            'service', 'framework', 'core', 'webview'
        ]
    }
};

/**
 * Categorizes an app based on its package name and app name
 * @param {string} packageName - The app's package name
 * @param {string} appName - The app's display name (optional)
 * @returns {string} The category of the app
 */
export const categorizeApp = (packageName, appName = '') => {
    if (!packageName) {
        return APP_CATEGORIES.OTHER;
    }

    const lowerPackageName = packageName.toLowerCase();
    const lowerAppName = appName.toLowerCase();

    // First, try exact package name matches
    for (const [category, data] of Object.entries(APP_CLASSIFICATION)) {
        if (data.packageNames.some(pkg => pkg === packageName)) {
            return category;
        }
    }

    // Then, try keyword matching in package name and app name
    for (const [category, data] of Object.entries(APP_CLASSIFICATION)) {
        const matchesKeyword = data.keywords.some(keyword => 
            lowerPackageName.includes(keyword) || lowerAppName.includes(keyword)
        );
        
        if (matchesKeyword) {
            return category;
        }
    }

    // Special cases for common patterns
    if (lowerPackageName.includes('game') || lowerPackageName.includes('play')) {
        return APP_CATEGORIES.GAMES;
    }

    if (lowerPackageName.includes('com.android') || lowerPackageName.includes('com.google.android')) {
        return APP_CATEGORIES.SYSTEM;
    }

    return APP_CATEGORIES.OTHER;
};

/**
 * Gets all apps in a specific category
 * @param {Array} apps - Array of app objects
 * @param {string} category - Category to filter by
 * @returns {Array} Apps in the specified category
 */
export const getAppsByCategory = (apps, category) => {
    return apps.filter(app => 
        categorizeApp(app.packageName, app.name) === category
    );
};

/**
 * Groups apps by their categories
 * @param {Array} apps - Array of app objects
 * @returns {Object} Apps grouped by category
 */
export const groupAppsByCategory = (apps) => {
    const grouped = {};
    
    // Initialize all categories
    Object.values(APP_CATEGORIES).forEach(category => {
        grouped[category] = [];
    });

    // Group apps
    apps.forEach(app => {
        const category = categorizeApp(app.packageName, app.name);
        grouped[category].push(app);
    });

    // Remove empty categories
    Object.keys(grouped).forEach(category => {
        if (grouped[category].length === 0) {
            delete grouped[category];
        }
    });

    return grouped;
};

/**
 * Gets category statistics
 * @param {Array} apps - Array of app objects  
 * @returns {Object} Statistics about app categories
 */
export const getCategoryStats = (apps) => {
    const stats = {};
    const total = apps.length;

    Object.values(APP_CATEGORIES).forEach(category => {
        const categoryApps = getAppsByCategory(apps, category);
        stats[category] = {
            count: categoryApps.length,
            percentage: total > 0 ? Math.round((categoryApps.length / total) * 100) : 0
        };
    });

    return stats;
};

/**
 * Checks if an app is in a high-risk category
 * @param {string} packageName - The app's package name
 * @param {string} appName - The app's display name
 * @returns {boolean} True if the app is in a high-risk category
 */
export const isHighRiskCategory = (packageName, appName = '') => {
    const category = categorizeApp(packageName, appName);
    const highRiskCategories = [
        APP_CATEGORIES.SOCIAL,
        APP_CATEGORIES.COMMUNICATION,
        APP_CATEGORIES.FINANCE,
        APP_CATEGORIES.HEALTH_FITNESS
    ];
    
    return highRiskCategories.includes(category);
};

/**
 * Gets the icon color/theme associated with a category
 * @param {string} category - App category
 * @returns {string} Color hex code for the category
 */
export const getCategoryColor = (category) => {
    const colors = {
        [APP_CATEGORIES.SOCIAL]: '#3B82F6', // Blue
        [APP_CATEGORIES.COMMUNICATION]: '#10B981', // Green
        [APP_CATEGORIES.ENTERTAINMENT]: '#F59E0B', // Yellow
        [APP_CATEGORIES.PRODUCTIVITY]: '#8B5CF6', // Purple
        [APP_CATEGORIES.SHOPPING]: '#EF4444', // Red
        [APP_CATEGORIES.FINANCE]: '#059669', // Emerald
        [APP_CATEGORIES.HEALTH_FITNESS]: '#EC4899', // Pink
        [APP_CATEGORIES.EDUCATION]: '#6366F1', // Indigo
        [APP_CATEGORIES.NEWS]: '#374151', // Gray
        [APP_CATEGORIES.TRAVEL]: '#06B6D4', // Cyan
        [APP_CATEGORIES.FOOD_DRINK]: '#F97316', // Orange
        [APP_CATEGORIES.PHOTO_VIDEO]: '#84CC16', // Lime
        [APP_CATEGORIES.MUSIC]: '#A855F7', // Violet
        [APP_CATEGORIES.GAMES]: '#22C55E', // Green
        [APP_CATEGORIES.UTILITIES]: '#64748B', // Slate
        [APP_CATEGORIES.BUSINESS]: '#0F172A', // Dark
        [APP_CATEGORIES.LIFESTYLE]: '#BE185D', // Rose
        [APP_CATEGORIES.WEATHER]: '#0EA5E9', // Sky
        [APP_CATEGORIES.SPORTS]: '#DC2626', // Red
        [APP_CATEGORIES.BOOKS]: '#7C2D12', // Amber
        [APP_CATEGORIES.MEDICAL]: '#DC2626', // Red
        [APP_CATEGORIES.NAVIGATION]: '#059669', // Emerald
        [APP_CATEGORIES.SYSTEM]: '#6B7280', // Gray
        [APP_CATEGORIES.OTHER]: '#9CA3AF' // Gray
    };
    
    return colors[category] || colors[APP_CATEGORIES.OTHER];
};

export default {
    APP_CATEGORIES,
    categorizeApp,
    getAppsByCategory,
    groupAppsByCategory,
    getCategoryStats,
    isHighRiskCategory,
    getCategoryColor
};