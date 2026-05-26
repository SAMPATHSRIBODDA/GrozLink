const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
	compress: {
		drop_console: true,
		drop_debugger: true,
	},
	mangle: true,
};

module.exports = config;
