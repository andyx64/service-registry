## serverless-service-registry

Serverless plugin for automatically adding ssm variables when deploying.

## Features
+ Adds API Gateway id to SMM values      
+ Custom SMM values from serverless.yml
+ Delete SMM on remove

## How to use
   

####Installation 
Install it to dev dependencies  

``
npm i serverless-service-registry --save-dev
``

and add it to your plugins in serverless.yml 

```yaml
plugins:
  - serverless-service-registry
```



####Setup

In your serverless.yml you can add following properties:

######Example
```yaml
custom:
  serviceRegistry:
    value:
      public: false
    description:
      A Nice Microservice!
```

All properties under value will be added to the value field of SMM.

The description property is your SMM description.

Now just deploy via

```
sls deploy --aws-profile yourPrfoile
```

Done!

#### After deploy

After deplyoing your SMM should look something like that.


```json
{
"public": false,
"region":"us-east-1",
"stage":"dev",
"providerName":"aws",
"apiId":"rje0402x51",
"invokeUrl":"https://rje0402x51.execute-api.us-east-1.amazonaws.com/dev"
}

```

The public field is from your serverless.yml.

#### Deleting

If you removing your serverless project via

```
sls remove --aws-profile yourPrfoile
```

the SSM Parameter gets also removed. 
