'use strict';
const AWS = require('aws-sdk');



class ServiceRegistryPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      createServiceRegistry: {
        lifecycleEvents: [
          'createSSM',
        ],
      },
      deleteServiceRegistry: {
        lifecycleEvents: [
          'deleteSSM',
        ],
      },
    };

    this.hooks = {
      'after:deploy:deploy': () => this.serverless.pluginManager.run(['createServiceRegistry']),
      'createServiceRegistry:createSSM': this.createSSM.bind(this),

      'after:remove:remove': () => this.serverless.pluginManager.run(['deleteServiceRegistry']),
      'deleteServiceRegistry:deleteSSM': this.deleteSSM.bind(this),
    };
  }

  // CREATE ===========================

  async createSSM() {
    this.serverless.cli.log('Creating SSM Parameter...');
    const ssm = this._initSSM()

    const providerName = this.serverless.service.provider.name
    const region = this.options.region || this.serverless.service.provider.region
    const stage = this.options.stage || this.serverless.service.provider.stage


    const serviceName = this.serverless.service.service

    const customValues = this.serverless.service.custom.serviceRegistry.value || ''
    const description = this.serverless.service.custom.serviceRegistry.description ||''

    const ssmPath = this._pathBuilder('services', providerName, serviceName);
    const apiId = await this._getApiId()


    var params = {
      Name: ssmPath, /* required */
      Type: 'String',
      Value: JSON.stringify({
        ...customValues,
        apiId: apiId,
        region,
        stage,
        invokeUrl: this._invokeUrlBuilder(apiId, region, stage)
      }),
      Description:  description || '',
      Overwrite: true,
    };


    const createParamater = await ssm.putParameter(params, (err, data) => {
      if (err) {
        this.serverless.cli.log(err);
      } else {
        this.serverless.cli.log(`SSM created with the path: "${ssmPath}" with the Api Id: "${apiId}"`);
        this.serverless.cli.log('Have a nice day!');
      }// successful response
    }).promise();

    return createParamater;

  }


  // DELETE ===========================

  async deleteSSM () {
    this.serverless.cli.log('Deleting SSM Parameter...');
    const ssm =  this._initSSM();
    const providerName = this.serverless.service.provider.name
    const serviceName = this.serverless.service.service
    const ssmPath = this._pathBuilder('services', providerName, serviceName);

    var params = {
      Name: ssmPath
    };

    const deleteParameter = await ssm.deleteParameter(params, (err, data) => {
      if (err) {
        this.serverless.cli.log(err);
      } else {
        this.serverless.cli.log('SSM successfully deleted!');
      }
    }).promise()

    return deleteParameter
  }

  // HELPER ===========================


  _pathBuilder(...segments) {
    var path = '';
    segments.forEach( segement => path += `/${segement}`);
    return path;
  }

  _initSSM(){
    let profile = this.options['aws-profile'] || this.serverless.service.custom.settings.profile
    var credentials = new AWS.SharedIniFileCredentials({profile: profile});
    AWS.config.credentials = credentials;
    AWS.config.update({region: this.serverless.service.provider.region})
    return new AWS.SSM();
  }

  _getApiId() {
    return new Promise(resolve => {
      this.serverless.getProvider('aws').request('CloudFormation', 'describeStacks', {StackName: this.serverless.getProvider('aws').naming.getStackName(this.stage)}).then(resp => {
        const output = resp.Stacks[0].Outputs;
        let apiUrl;

        output.filter(entry => entry.OutputKey.match('ServiceEndpoint')).forEach(entry => apiUrl = entry.OutputValue);
        const apiId = apiUrl.match('https:\/\/(.*)\\.execute-api')[1];
        resolve(apiId);
      });
    });
  }

  _invokeUrlBuilder(apiId, region, stage) {
    return `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`
  }


}

module.exports = ServiceRegistryPlugin;
