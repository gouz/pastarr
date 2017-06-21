#!/usr/bin/env node
"use strict";
const program = require("commander");
program
  .version("0.0.6")
  .parse(process.argv);

const fs = require("fs");
const request = require("request");
const wallpaper = require("wallpaper");
const Nightmare = require("nightmare");
let nightmare = Nightmare();

const search = process.argv[2];

let url = "https://www.google.fr/search?q="
        + encodeURI(search)
        + "&biw=1366&bih=658&tbm=isch&source=lnt&tbs=photo,isz:ex,iszw:1920,iszh:1080";

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
      const ext = img.substring(img.lastIndexOf("."));
      const uniq = (new Date()).getTime();
      request.head(img, (err, res, body) => {
        request(img)
          .pipe(fs.createWriteStream(uniq + ext))
          .on("close", () => {
            wallpaper
              .set(uniq + ext, {
                scale: "fill"
              })
              .then(() => {
                //fs.unlink(uniq + ext, () => {
                  console.log("done !");
                //});
              });
          });
      });
    }
    else
      console.log("not found");
  });
