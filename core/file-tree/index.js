var fs = require('fs'),
    extend = require('extend'),
    path = require('path');

    // sourceMaster root path
    var sourceRoot = global.opts.common.pathToSpecs,
        rootLength = global.opts.common.pathToSpecs.length;

// add directory name for exclude, write path from root ( Example: ['core','docs/base'] )
var excludedDirs = ['core','data','test','plugins','node_modules','.git'];

// path to output file to write parsed data in json format
var outputFile = 'data/pages_tree.json';

// File mask for search
var fileMask = 'index.html';

// for waiting when function finished
var FLAG = true;

// configuration for function timeout
// !!! on localhost recommend false on server true
var INTERVAL = false;
var INTERVAL_TIME = 60000;

// formatting RegExp for parser
var dirsForRegExp = '';
var i = 1;
excludedDirs.forEach(function(exlDir) {
    if (i<excludedDirs.length) {
        dirsForRegExp = dirsForRegExp+"^"+sourceRoot+"\/"+exlDir+"|";
    } else {
        dirsForRegExp = dirsForRegExp+"^"+sourceRoot+"\/"+exlDir;
    }
    i++;
});
var excludes = new RegExp(dirsForRegExp);

function fileTree(dir) {

    var arr = {},
        dirContent = fs.readdirSync(dir);

    dirContent.forEach(function(file) {

        if (dir.match(excludes)) {return}

        var urlToFile = dir + '/' + file,
            baseName = path.basename(dir);

        urlToFile = path.normalize(urlToFile);
        var urlFromHostRoot = urlToFile.replace('../','/');

        arr[baseName] = arr[baseName];

        var fileStats = fs.statSync(urlToFile);

        if (fileStats.isDirectory()) {

            var childObj = fileTree(urlToFile);
            if (fs.existsSync(urlToFile+"/"+fileMask) && Object.getOwnPropertyNames(childObj).length !== 0) {
                arr[file] = extend(arr[file],childObj)
            }

        } else if (file == fileMask) {

            var urlForJson = urlFromHostRoot.substring(rootLength, urlFromHostRoot.length);

            var page = {};

            if (fs.existsSync(dir+'/info.json')) {
                var fileJSON = require("../../"+dir+"/info.json");

            var d = new Date(fileStats.mtime);

            var lastmod = [d.getDate(), d.getMonth()+1, d.getFullYear()].join('.'),
                lastmodSec = Date.parse(fileStats.mtime),
                fileName = file,
                author = fileJSON.author,
                title = fileJSON.title,
                keywords = fileJSON.keywords;
                info = fileJSON.info;
        } else {
            // if info.json don't exist in project folder
            var lastmod = [d.getDate(), d.getMonth()+1, d.getFullYear()].join('.'),
                lastmodSec = Date.parse(fileStats.mtime),
                fileName = file,
                author = 'undefined',
                title = 'undefined',
                keywords = 'undefined',
                info = 'undefined';
            }

            page = {
                url: urlForJson,
                lastmod: lastmod,
                fileName: fileName,
                lastmodSec: lastmodSec,
                author: author,
                title: title,
                keywords: keywords,
                info: info
            };

            arr[file] = extend(page);
        }
    });
    return arr;
}

// function for write json file
var GlobalWrite = function() {
    fs.writeFile(global.app.get("specs path") + "/" + outputFile, JSON.stringify(fileTree(sourceRoot), null, 4), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Pages tree JSON saved to " + outputFile);
            FLAG=true;
        }
    });
};
// run function on server start
GlobalWrite();

// setInterval fot 1 minute (60000ms)
if (INTERVAL) {
    setInterval(function(){
        GlobalWrite();
    }, INTERVAL_TIME);
}

// run task from server homepage
module.exports.scan = function () {
    // FLAG for waiting script end and only then can be run again
    if (FLAG) {
        FLAG = false;
        setTimeout(function(){
            GlobalWrite();
        },5000);
    }
};