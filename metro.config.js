const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase SDK uses 'react-native' export condition in its package.json exports map.
// Expo's default metro config enables package exports but sets customConditions to [],
// so Metro would fall back to the browser bundle and Firebase Auth fails to register.
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;
