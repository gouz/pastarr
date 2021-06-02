#!/usr/bin/env node
const { chromium } = require("playwright");

const fs = require("fs");
const fetch = require("node-fetch");
const wallpaper = require("wallpaper");
const homedir = require("homedir");
const { program } = require("commander");

let origins = ["google", "deviantart", "unsplash"];

program
  .version("0.2.0")
  .requiredOption("-S, --search <s>", "search")
  .option("-W, --width <n>", "width of the screen")
  .option("-H, --height <n>", "height of the screen")
  .option("-O, --origin <n>", `website to scrap [${origins.join(", ")}]`)
  .parse();

(async () => {
  const search = program.opts().search;
  const width = program.opts().width ? parseInt(program.opts().width) : 1920;
  const height = program.opts().height ? parseInt(program.opts().height) : 1200;
  const origin =
    !program.opts().origin || origins.indexOf(program.opts().origin) == -1
      ? "google"
      : program.opts().origin;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const urls = {
    google: `https://www.google.fr/search?q=${encodeURI(
      search + "imagesize:" + width + "x" + height
    )}&tbm=isch&source=hp&biw=1920&bih=983`,
    deviantart: `https://www.deviantart.com/search?q=wallpaper%20${encodeURI(
      search + " " + width + "x" + height
    )}`,
    unsplash: `https://unsplash.com/s/photos/${encodeURI(
      search
    )}?orientation=landscape`,
  };
  const first_step = {
    google: "a.wXeWr",
    deviantart: 'a[data-hook="deviation_link"]',
    unsplash: 'a[itemprop="contentUrl"] img',
  };
  const final_step = {
    google: 'a[rlhc="1"] img',
    deviantart: 'div[data-hook="art_stage"] img',
    unsplash: null,
  };
  const methods = {
    unsplash: "srcset",
  };
  let url = urls[origin];
  await page.goto(url);
  let img;
  if (final_step[origin] != null) {
    await page.evaluate(
      ({ first_step, origin }) => {
        const arr = document.querySelectorAll(first_step[origin]);
        arr[Math.floor(Math.random() * arr.length)].click();
      },
      { first_step, origin }
    );
    await page.waitForSelector(final_step[origin]);
    await page.waitForTimeout(1000);
    img = await page.evaluate(
      ({ final_step, origin }) => {
        return document.querySelector(final_step[origin]).getAttribute("src");
      },
      { final_step, origin }
    );
  } else {
    img = await page.evaluate(
      ({ first_step, origin }) => {
        const arr = document.querySelectorAll(first_step[origin]);
        return arr[Math.floor(Math.random() * arr.length)].srcset;
      },
      { first_step, origin }
    );
  }
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
      res.body.on("end", () => {
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
