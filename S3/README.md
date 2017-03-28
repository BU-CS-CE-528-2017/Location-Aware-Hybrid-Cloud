# Fetch text data from S3

* Added dependence in package.json
```
"dependencies": {
    "aws-sdk": "^2.7.9"
  }
```
* Add package in handler.js
```js
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
```
* Grant Access in serverless.yml
```
iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:*
      Resource: "*"
```
* Fetch text data Google Annual Revenue and calculate average
* Display on local function
