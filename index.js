#!/usr/bin/env node
'use strict';
const program = require('commander');
program
  .version('0.0.1')
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

let url = "https://www.google.fr/search?q=" + search + "&biw=1366&bih=658&tbs=islt:2mp,itp:photo,qdr:d,isz:ex,iszw:1920,iszh:1080&tbm=isch&source=lnt";

nightmare
  .goto(url)
  .click("a.rg_l")
  .wait(1000)
  .evaluate(function() {
    return new Promise((resolve, reject) => {
          resolve(document.querySelectorAll(".irc_fsl")[1].getAttribute("href"));
     });
  })
  .end()
  .then(function(url) {
    download(url, search + '.png', function() {
        wallpaper.set(search + ".png", {
          scale: "fill"
        }).then(function() {
          fs.unlink(search + '.png', function() {
            console.log('done!')
          })
        })
      })
  })
