        const deploy_promises = test_files.map((file) => {
              console.log(`deploying the ${file}`)
              shell.cd(file);
              shell.exec('serverless deploy');
              shell.cd(localpath)
              return Promise.resolve();
        });
        Promise.all(deploy_promises).then(() => {
            console.log(`getting the serverless information`)
            const info_promises = test_files.map((file) =>{
                shell.cd(file);
                shell.exec('serverless info',(code,stdout,stderr) => {
                if(code != '0'){
                    console.log(stderr)
                }else{
                    const info = stdout.toString().split("\n");
                    for(var i = 0; i < info.length; i++) {
                        if(info[i] == 'endpoints:'){
                            const endpoints = info[i + 1];
                            var uri = endpoints.slice(9,-1);
                            name_uri[file] = uri;
                        }
                    }
                }
                })
                shell.cd(localpath);
                return Promise.resolve();
            });
            return Promise.all(info_promises);
        })
      console.log(done)





        console.log(outputPath)
        const dirs = p => readdir(p).filter(f => fs.stat(p+"/"+f).isDirectory());
        const files = dirs(outputPath);
        console.log(files)



        function(err, result) {
                console.log('processing done')
                return Promise.resolve();
            }