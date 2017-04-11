# Location-Aware-Hybrid-Cloud
EC528 Cloud Computing Project Location Aware Hybrid Cloud

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
Old Way: <br />
* Step 1: "npm install" (install node module dependencies) <br />
* Step 2: "npm run build" (genereate es5, node.js compatible file) <br />
* Step 3: change to dist directry and run "node index.js --mode live" <br />
* Step 4: "node files/local.js" to run the app <br>
<br>
New Way: <br />
* Step 1: "npm install" (install node module dependencies) <br />
* Step 2: "npm run lahc" (genereate es5, node.js compatible file, deploy, and run) <br />
<br><br>

## Project Structure:
![Alt text](https://github.com/BU-CS-CE-528-2017/Location-Aware-Hybrid-Cloud/blob/master/system_architecture.png "System Architecture")

### The executor has four modes:
1. **extract-cloud**: to extract cloud function from customer js file, and build a serverless.yml file for each function.
2. **deploy-cloud**: to deploy the extracted cloud function on to AWS Lambda through serverless
3. **prepare-local**: it will get back the uri of cloud function from AWS and generate a local.js file with request to AWS.
4. **live**: run through all the above command in one mode
**Finally**, run "node local.js" to execute the functions.

### Setting up babel environment:
1. Install node
2. Create package.json https://docs.npmjs.com/getting-started/using-a-package.json
3. Install babel https://babeljs.io/docs/setup/#installation  (Ex $ npm install babel-core babel-cli)
https://www.youtube.com/watch?v=sZ0z7B7QmjI
https://github.com/bradtraversy/youtube_es2015_source/tree/master/01_babel
  
4. $ cd src
5. $ npm run build
  