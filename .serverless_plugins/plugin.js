'use strict';

class ServiceRegistryPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      serviceRegistry: {
        lifecycleEvents: [
          'initSSM',
        ],
        options: {
          message: {
            usage:
              'Specify the message you want to deploy '
              + '(e.g. "--message \'My Message\'" or "-m \'My Message\'")',
            required: true,
            shortcut: 'm',
          },
        },
      },
    };

    this.hooks = {
      'after:deploy:deploy': () => this.serverless.pluginManager.run(['serviceRegistry']),
      'serviceRegistry:initSSM': this.initSSM.bind(this),
    };
  }

  initSSM() {
    this.serverless.cli.log('Hello from Serverless!');
  }
}

module.exports = ServiceRegistryPlugin;
