babel src --out-dir dist
tape dist/**/testIndex.js
cd dist/cloud/
ls > ../dirc.txt
for i in $(cat ../dirc.txt)
do
	(cd $i && 
	serverless deploy && serverless info >> info.txt)
done


