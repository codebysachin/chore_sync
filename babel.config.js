module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      helpers: true,
      regenerator: true
    }],
    '@babel/plugin-transform-flow-strip-types'
  ]
};
