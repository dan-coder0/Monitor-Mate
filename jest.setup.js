// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Mock the native module
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  InstalledApps: {
    getInstalledApps: jest.fn(() => Promise.resolve([])),
    getAppDetails: jest.fn(() => Promise.resolve({})),
  },
  PlatformConstants: {
    getConstants: () => ({
      forceTouchAvailable: false,
      osVersion: '14.0',
      systemName: 'iOS',
    }),
  },
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock permissions
jest.mock('react-native-permissions', () => {
  return {
    request: jest.fn(() => Promise.resolve('granted')),
    check: jest.fn(() => Promise.resolve('granted')),
    PERMISSIONS: {
      ANDROID: {
        READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',
        ACCESS_NETWORK_STATE: 'android.permission.ACCESS_NETWORK_STATE',
      },
    },
    RESULTS: {
      UNAVAILABLE: 'unavailable',
      DENIED: 'denied',
      LIMITED: 'limited',
      GRANTED: 'granted',
      BLOCKED: 'blocked',
    },
  };
});