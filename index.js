#!/usr/bin/env node
const { chromium } = require("playwright");

const fs = require("fs");
const fetch = require("node-fetch");
const wallpaper = require("wallpaper");
const homedir = require("homedir");
const { program } = require("commander");

program
  .version("0.1.1")
  .requiredOption("-S, --search <s>", "search")
  .option("-W, --width <n>", "width of the screen")
  .option("-H, --height <n>", "height of the screen")
  .parse();

(async () => {
  const search = program.opts().search;
  const width = program.opts().width
    ? `${parseInt(program.opts().width)} `
    : 1920;
  const height = program.opts().height
    ? `${parseInt(program.opts().height)} `
    : 1200;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let url =
    "https://www.google.fr/search?q=" +
    encodeURI(`${search} imagesize:${width}x${height}`) +
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
    fetch(img).then((res) => {
      const dest = fs.createWriteStream(path + uniq + ext);
      res.body.pipe(dest);
      wallpaper
        .set(path + uniq + ext, {
          scale: "fill",
        })
        .then(() => {
          console.log("done ! (" + path + uniq + ext + ")");
        });
    });
  } else console.log("not found");
  await browser.close();
})();
