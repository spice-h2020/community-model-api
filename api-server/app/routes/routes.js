module.exports = app => {
    const yaml = require('js-yaml');
    const fs   = require('fs');

    const customControllers =  {
        Users: require("../controllers/users.js"),
        Communities: require("../controllers/communities.js"),
        Similarity: require("../controllers/similarity.js")
    };
    
    function initRouters(router){
        try {
            const doc = yaml.load(fs.readFileSync(app.get("apiSpec"), 'utf8'));
            router.path = doc.servers[0].url;
            let routes = [];
            for (let path in doc.paths) {
                let newPath = transformPath(path);
                const restActions = ['get','post','put','delete'];
                for (const action of restActions) {
                    if (doc.paths[path][action]) {
                        
                        let service = doc.paths[path][action]['x-swagger-router-controller'];
                        let method = doc.paths[path][action]['operationId'];
                        router[action](newPath, customControllers[service][method]);
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
    
    function transformPath (path) {
        const regex = /{([^}]+)}/g;
        let parameters = path.match(regex);
        let result = path;
        if (parameters){
            
            for (let i=0; i<parameters.length; ++i) {
                let word = parameters[i].slice(1,-1);
                let words = word.split('-');
                for (let j=1; j<words.length; ++j) {
                    let temp = words[j];
                    words[j] = temp.charAt(0).toUpperCase()+temp.slice(1); 
                }
                parameters[i] = ":" + words.join('');
            }
            result = path.replace(regex, ()=> parameters.shift());
        }
        return result; 
    }
    
    const express = require("express");
    
    var router = express.Router();
    
    initRouters(router);
    app.use('/', express.static('api'));  
    app.use(router.path, router);

};