'use strict';
const AWS = require('aws-sdk');
var ssm;


class ServiceRegistryPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      serviceRegistry: {
        lifecycleEvents: [
          'initSSM',
        ],
      },
    };

    this.hooks = {
      'after:deploy:deploy': () => this.serverless.pluginManager.run(['serviceRegistry']),
      'serviceRegistry:initSSM': this.initSSM.bind(this),
    };
  }

  initSSM() {
    this.serverless.cli.log('Creating SSM Parameter...');   
    this._setupAWS()

    const provideName = this.serverless.service.provider.name
    const serviceName = this.serverless.service.service

    const ssmPath = this._pathBuilder('services', provideName, serviceName);


    var params = {
      Name: ssmPath, /* required */
      Type: 'String',
      Value: '1', /* required */
      Description: 'A Microservice',
      Overwrite: true,
    };


    const createParamater = ssm.putParameter(params, (err, data) => {
      if (err) this.serverless.cli.log('SSM Parameter Failed!');            // an error occurred
      else     this.serverless.cli.log('SSM Parameter Created!');           // successful response
    }).promise();

    return createParamater;

    //this.serverless.cli.log(`${this.serverless.service.functions.hello.handler}`);
  }


_pathBuilder(...segments) {
  var path = '';
  segments.forEach( segement => path += `/${segement}`);
  return path;
}

_setupAWS(){ 
  AWS.config.update({region: this.serverless.service.provider.region}) 
  ssm = new AWS.SSM()
} 


}

module.exports = ServiceRegistryPlugin;
