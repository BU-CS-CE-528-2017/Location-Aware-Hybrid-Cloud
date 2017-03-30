# Location-Aware-Hybrid-Cloud
EC528 Cloud Computing Project Location Aware Hybrid Cloud

Group Member: Jiaxing Tian, John Keisling, Prerana Haridoss, Tianyu Gu

Mentor: Rodrigo Manyari

## Vision and Goals Of The Project:
Some interesting large datasets reside in public cloud providers, such as Google Cloud Services (GCS) and Amazon Web Services (AWS). However, a company may desire certain calculations and information to only reside in its private cloud. Moving large amounts of data from the public cloud to the private cloud is expensive and time consuming. This project aims to build a toolkit that achieves computational locality by using a combination “Function as a Service” (FaaS) and containers. In this way, preliminary calculations and queries can be implemented in a public cloud, and then the intermediate result can be transferred back to private cloud. High-level goals of this project include:
* Enabling computational locality via FaaS: This application will transpile the input functions so as to call its equivalent cloud functions in different cloud.
* Reducing development lifecycle: With this project, components in different clouds could be considered and integrated as a single application, therefore reducing the development complexity.

## Users Of The Project:

This project would be used by companies and research teams that have multiple
applications or computational modules in different clouds. Examples include investment banks, hedge funds, or tech companies driven by concerns for safety, privacy, or amount of computation.
A simple demo program:<br><br>

* Step 1: "npm run build" ( genereate es5, node.js compatible file). <br />
* Step 2: set the parameter input directory and output directory in the index.js <br />
* Step 3: "node index.js" to run the babel plugin and generate cloud function. <br>
* Step 4: "npm run deploy" to deploy on aws lambda && call local.js to display result. <br />
<br><br>

### Setting up babel environment:
1. Install node
2. Create package.json https://docs.npmjs.com/getting-started/using-a-package.json
3. Install babel https://babeljs.io/docs/setup/#installation  (Ex $ npm install babel-core babel-cli)
https://www.youtube.com/watch?v=sZ0z7B7QmjI
https://github.com/bradtraversy/youtube_es2015_source/tree/master/01_babel
  
4. $ cd src
5. $ npm run build
  
