const webpack = require("webpack");

const { parsed: myEnv } = require("dotenv").config({
  path: `.env.${process.env.APP_ENV}`,
  // Override any previously set values.
  // .local_node needs this since .local is loaded first.
  override: true,
});
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  webpack(config) {
    config.plugins.push(new webpack.EnvironmentPlugin(myEnv));
    return config;
  },
};

module.exports = nextConfig;
