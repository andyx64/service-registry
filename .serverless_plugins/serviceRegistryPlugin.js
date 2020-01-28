'use strict';
const AWS = require('aws-sdk');



class ServiceRegistryPlugin {

  ssm;
  providerName;
  region;
  stage;
  serviceName;
  customValues;
  description;
  ssmPath;


  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.ssm = this._initSSM()

    this.providerName = this.serverless.service.provider.name || 'aws'
    this.region = this.options.region || this.serverless.service.custom.serviceRegistry.region || this.serverless.service.provider.region
    this.stage = this.options.stage || this.serverless.service.custom.serviceRegistry.stage || this.serverless.service.provider.stage
    this.serviceName = this.options.serviceName || this.serverless.service.custom.serviceRegistry.serviceName || this.serverless.service.service
    this.customValues = this.serverless.service.custom.serviceRegistry.value || ''
    this.description = this.serverless.service.custom.serviceRegistry.description ||''
    this.ssmPath = this._pathBuilder('services', this.providerName, this.serviceName);

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
      'createServiceRegistry:createSSM': this.createSSM,

      'after:remove:remove': () => this.serverless.pluginManager.run(['deleteServiceRegistry']),
      'deleteServiceRegistry:deleteSSM': this.deleteSSM,
    };
  }

  // CREATE ===========================

  async createSSM() {
    this.serverless.cli.log('Creating SSM Parameter...');
    
    apiId = await this._getApiId()


    var params = {
      Name: this.ssmPath, /* required */
      Type: 'String',
      Value: JSON.stringify({
        ...customValues,
        apiId: this.apiId,
        region: this.region,
        stage: this.stage,
        invokeUrl: this._invokeUrlBuilder(this.apiId, this.region, this.stage)
      }),
      Description:  this.description || '',
      Overwrite: true,
    };


    const createParamater = await this.ssm.putParameter(params, (err, data) => {
      if (err) {
        this.serverless.cli.log(err);
      } else {
        this.serverless.cli.log(`SSM created with the path: "${this.ssmPath}" with the Api Id: "${this.apiId}"`);
        this.serverless.cli.log('Have a nice day!');
      }// successful response
    }).promise();

    return createParamater;

  }


  // DELETE ===========================

  async deleteSSM () {
    this.serverless.cli.log('Deleting SSM Parameter...');

    var params = {
      Name: this.ssmPath
    };

    const deleteParameter = await this.ssm.deleteParameter(params, (err, data) => {
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
