module.exports = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  startOperationBatch: jest.fn(),
  finishOperationBatch: jest.fn(),
  createAnimatedComponent: (component) => component,
}; 