babel src --out-dir dist
tape dist/**/testIndex.js
cd dist/test/scratch/aws/
ls > ../dirc.txt
for i in $(cat ../dirc.txt)
do
	(cd $i && 
	serverless deploy && serverless info >> info.txt)
done


