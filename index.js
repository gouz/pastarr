#!/usr/bin/env node
'use strict';
const program = require('commander');
program
  .version('0.0.3')
  .parse(process.argv);

const wallpaper = require('wallpaper');
const Nightmare = require('nightmare');
let nightmare = Nightmare();

const search = process.argv[2];

let fs = require('fs');
let request = require('request');

let download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

let url = "https://www.google.fr/search?q="
        + search
        + "&biw=1366&bih=658&tbs=islt:2mp,itp:photo,qdr:d,isz:ex,iszw:1920,iszh:1080&tbm=isch&source=lnt";

nightmare
  .goto(url)
  .wait('a.rg_l')
  .evaluate(function() {
    const arr = document.querySelectorAll("a.rg_l");
    arr[Math.floor(Math.random() * arr.length)].click();
  })
  .evaluate(function() {
    return new Promise((resolve, reject) => {
      resolve(document.querySelectorAll(".irc_fsl")[1].getAttribute("href"));
    });
  })
  .end()
  .then(function(url) {
    const ext = url.substring(url.lastIndexOf('.'));
    const uniq = (new Date()).toString();
    download(url, uniq + ext, function() {
        wallpaper.set(uniq + ext, {
          scale: "fill"
        }).then(function() {
          fs.unlink(uniq + ext, function() {
            console.log('done !')
          })
        })
      })
  })
