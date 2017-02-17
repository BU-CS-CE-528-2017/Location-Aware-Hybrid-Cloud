* install serverless
'''npm install -g serverless'''
* Configuration credential
'''serverless config credentials --provider aws --key yourkey --secret yoursecret'''
* create service via template 
'''serverless create --template aws-nodejs --path myService'''
* invoke event with data in json
'''serverless invoke -p event.json'''
* invoke with function name
'''serverless invoke  --function functionName'''
* deploy the whole app
'''serverless deploy'''
* deploy the function
'''serverless deploy function --function myFunction'''
* remove the service
'''serverless remove -v'''
