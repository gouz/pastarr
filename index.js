#!/usr/bin/env node
"use strict";
const program   = require("commander");
const fs        = require("fs");
const request   = require("request");
const wallpaper = require("wallpaper");
const Nightmare = require("nightmare");
const homedir   = require("homedir");
const fileType  = require('file-type');
const readChunk = require('read-chunk');

program
  .version("0.0.9")
  .usage('[options] search')
  .option('-W, --width <n>', 'width of the screen', 1920, parseInt)
  .option('-H, --height <n>', 'height of the screen', 1080, parseInt)
  .action((search, options) => {
    let nightmare = Nightmare();
    let url = "https://www.google.fr/search?q="
            + encodeURI(search)
            + "&biw=1366&bih=658&tbm=isch&source=lnt&tbs=photo,isz:ex,iszw:"
            + options.width
            + ",iszh:"
            + options.height;

    nightmare
      .goto(url)
      .wait("a.rg_l")
      .evaluate(() => {
        const arr = document.querySelectorAll("a.rg_l");
        arr[Math.floor(Math.random() * arr.length)].click();
      })
      .wait(".irc_fsl[tabindex=\"0\"]")
      .evaluate(() => {
        return document.querySelector(".irc_fsl[tabindex=\"0\"]").getAttribute("href");
      })
      .end()
      .then((img) => {
        if (img != "")
        {
          const path = homedir() + '/pastarr/';
          try {
            fs.accessSync(path);
          } catch (e) {
            fs.mkdirSync(path);
          }
          const ext = img.substring(img.lastIndexOf("."));
          const uniq = (new Date()).getTime();
          request.head(img, (err, res, body) => {
            request(img)
              .pipe(fs.createWriteStream(path + uniq + ext))
              .on("close", () => {
                const buffer = readChunk.sync(path + uniq + ext, 0, 4100);
                let ft = fileType(buffer);
                if (ft.ext == 'jpg' || ft.ext == 'png')
                  wallpaper
                    .set(path + uniq + ext, {
                      scale: "fill"
                    })
                    .then(() => {
                      console.log("done ! (" + path + uniq + ext + ")");
                    });
                else
                  console.log('error while downloading, please retry')
              });
          });
        }
        else
          console.log("not found");
      });

  })
  .parse(process.argv);
