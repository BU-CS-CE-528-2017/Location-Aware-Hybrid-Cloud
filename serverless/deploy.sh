#!/bin/bash
# deploy serverless on AWS
# $0 is the command itself $1 is the first arguement, and so ons
serverless deploy
# invoke the function and write the result 
serverless invoke -f calcPrimes > output.txt
# Print the file 
node local_index.js output.txt
# remove service
serverless remove -v

