class BaseIntegration {
  constructor(config = {}) {
    this.config = config;
  }

  async testConnection() {
    return { success: true, message: 'Connection test passed' };
  }
}

module.exports = BaseIntegration;
