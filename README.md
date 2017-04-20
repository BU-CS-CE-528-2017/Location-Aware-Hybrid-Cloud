# Location-Aware-Hybrid-Cloud
The project can be found on npm.org [Location Aware Hybrid Cloud.](https://www.npmjs.com/package/location-aware-hybrid-cloud)
run ```npm install location-aware-hybrid-cloud --save``` to install through npm manager.<br>

**Mentor:** *Rodrigo Manyari* <br>
**Group Member:** *Jiaxing Tian, John Keisling, Prerana Haridoss, Tianyu Gu* <br>

## Vision and Goals Of The Project:
Some interesting large datasets reside in public cloud providers, such as Google Cloud Services (GCS) and Amazon Web Services (AWS). However, a company may desire certain calculations and information to only reside in its private cloud. Moving large amounts of data from the public cloud to the private cloud is expensive and time consuming. This project aims to build a toolkit that achieves computational locality by using a combination “Function as a Service” (FaaS) and containers. In this way, preliminary calculations and queries can be implemented in a public cloud, and then the intermediate result can be transferred back to private cloud. High-level goals of this project include:
* Enabling computational locality via FaaS: This application will transpile the input functions so as to call its equivalent cloud functions in different cloud.
* Reducing development lifecycle: With this project, components in different clouds could be considered and integrated as a single application, therefore reducing the development complexity.

## Users Of The Project:

This project would be used by companies and research teams that have multiple
applications or computational modules in different clouds. Examples include investment banks, hedge funds, or tech companies driven by concerns for safety, privacy, or amount of computation.
A simple demo program:<br><br>

## Project Setup
Write your JS file in normal way and add comments to deploy on cloud. Detail of the comments can be found below.

### For running on AWS Lambda
You need to have an AWS account and save the root access key in .aws folder. Detail information can be see [Getting starts with AWS](http://docs.aws.amazon.com/gettingstarted/latest/awsgsg-intro/gsg-aws-intro.html).<br>
The provider is aws and only augrement supported now is regions to be deployed in aws.
```
/* @cloud 
  - Provider: aws
  - Args: 
    - Region: 'some region'
*/
```

### For running on Google Cloud Function
You need to have an Google Cloud Service account, create corresponding project first on the Google Cloud Console, and get the credential key files. More can be see at the github project [Go through the Setup Google Cloud Part to setup before deployment.](https://github.com/serverless/serverless-google-cloudfunctions)
The provider is gcf as google cloud function and passing arguements includes the region that is supposed to deploy, projectId which is created in google cloud console and path for the credential key file.
```
/* @cloud 
  - Provider: gcf
  - Args: 
    - Region: 'some region'
    - Project: ‘someId’
    - Credential: 'file'
*/
```
### How to run the project
Put the JS code in src\files\main.js ```sudo npm install -g```
Old Way: <br />
* Step 1: ```sudo npm install -g``` install node module dependencies globally <br />
* Step 2: ```npm run build``` genereate es5, node.js compatible file. The result files are in dist folder. <br />
* Step 4: ```npm run deploy``` to deploy the cloud functions to the clouds <br>
* Step 5: ```npm run start``` to run the application <br>
<br>

New Way: <br />
* Step 1: ```sudo npm install -g``` (install node module dependencies) <br />
* Step 2: ```npm run lahc``` (genereate es5, node.js compatible file, deploy, and run) <br />
<br>

## Project Structure:
![Alt text](https://github.com/BU-CS-CE-528-2017/Location-Aware-Hybrid-Cloud/blob/master/system_architecture.png "System Architecture")

### The executor has four modes:
1. **extract-cloud**: to extract cloud function from customer js file, and build a serverless.yml file for each function.
2. **deploy-cloud**: to deploy the extracted cloud function on to AWS Lambda through serverless
3. **prepare-local**: it will get back the uri of cloud function from AWS and generate a local.js file with request to AWS.
4. **live**: run through all the above command in one mode
**Finally**, run "node local.js" or "npm run start" to execute the functions.

### Setting up babel environment:
1. Install node
2. Create package.json https://docs.npmjs.com/getting-started/using-a-package.json
3. Install babel https://babeljs.io/docs/setup/#installation  (Ex $ npm install babel-core babel-cli)
https://www.youtube.com/watch?v=sZ0z7B7QmjI
https://github.com/bradtraversy/youtube_es2015_source/tree/master/01_babel
  
4. $ cd src
5. $ npm run build

## How to contribute
The project has two parts with Babel transpile and serverless deployment. 
Babel transpile files are in the src folder as index.js executor.js and parser.js <br>
1. index.js is the start of program and defines the input directory output directory and running mode.<br>
Modify the bellow to change default setting.<br>
Example command ```node index.js -m live -i input -d output```

```javascript
var yargOptions = {
	mode: {
		alias: 'm',
		describe: 'Mode in which to run the CLI',
		default: 'extract-cloud',
		demand: true,
		choices: ['extract-cloud', 'deploy-cloud', 'prepare-local', 'live'],
		type: 'string'
	},
	'input-dir': {
		alias: 'i',
		default: './files',
		describe: 'Root directory containing the code to be parsed and deployed',
		demand: true,
		type: 'string'
	},
	'output-dir': {
		alias: 'd',
		default: './cloud',
		describe: 'Target directory where the CLI outputs all the runnable files',
		demand: true,
		type: 'string'
	}
};
```
2. executor.js defines all the modes and execution of different modes
  * extract cloud will execute the parser.js and extract cloud function to dist/cloud/ folder. Each cloud function has its own folder function.js and serverless.yml file. All the setting of serverless.yml can be accessed there. 
  * deploy cloud will deploy all the functions to there cloud respectively. 
  * prepare local will get back the deployment url and prepare the local.js file in dist/files. local.js is file with http request to the cloud provider for cloud functions. 
 
3. parser.js is the acctural execution of Babel. Only AWS and GCF are supported now. 
