#!/usr/bin/env node
const { chromium } = require("playwright");

const fs = require("fs");
const request = require("request");
const wallpaper = require("wallpaper");
const homedir = require("homedir");
const readChunk = require("read-chunk");
const program = require("commander");

program
  .version("0.1.0")
  .usage("[options] search")
  .option("-W, --width <n>", "width of the screen", 1920, parseInt)
  .option("-H, --height <n>", "height of the screen", 1080, parseInt)
  .action((search, options) => {
    (async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      let url =
        "https://www.google.fr/search?q=" +
        encodeURI(`${search} imagesize:${options.width}x${options.height}`) +
        "&tbm=isch&source=hp&biw=1920&bih=983";
      await page.goto(url);
      await page.evaluate(() => {
        const arr = document.querySelectorAll("a.wXeWr");
        arr[Math.floor(Math.random() * arr.length)].click();
      });
      await page.waitForSelector('a[rlhc="1"]');
      const img = await page.evaluate(() => {
        return document.querySelector('a[rlhc="1"] img').getAttribute("src");
      });
      if (img.startsWith("http")) {
        const path = homedir() + "/pastarr/";
        try {
          fs.accessSync(path);
        } catch (e) {
          fs.mkdirSync(path);
        }
        const ext = ".png";
        const uniq = new Date().getTime();
        request.head(img, (err, res, body) => {
          request(img)
            .pipe(fs.createWriteStream(path + uniq + ext))
            .on("close", () => {
              readChunk.sync(path + uniq + ext, 0, 4100);
              wallpaper
                .set(path + uniq + ext, {
                  scale: "fill",
                })
                .then(() => {
                  console.log("done ! (" + path + uniq + ext + ")");
                });
            });
        });
      } else console.log("not found");
      await browser.close();
    })();
  })
  .parse(process.argv);
