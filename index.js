#!/usr/bin/env node
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: false });

const fs = require("fs");
const fetch = require("node-fetch");
const wallpaper = require("wallpaper");
const homedir = require("homedir");
const base64ToImage = require('base64-to-image');
const { program } = require("commander");

const { config } = require("./config.json");

program
  .version("0.3.0")
  .usage("[options]")
  .description("replace your wallpaper from CLI", {
    options: "options like search, width, height or origin",
  })
  .requiredOption(
    "-S, --search <query>",
    "subject of the wallpaper you want",
    ""
  )
  .option("-W, --width <n>", "width of the screen", 1920, parseInt)
  .option("-H, --height <n>", "height of the screen", 1080, parseInt)
  .option(
    "-O, --origin <site>",
    `website to scrap [${Object.keys(config).join(", ")}]`,
    "google"
  )
  .parse();

const options = program.opts();
if ("" == options.search)
  program.help();
else {
  const origin = options.origin;
  let url = config[origin].url;
  let query = config[origin].search;
  query = query.replace(/_search_/i, options.search);
  query = query.replace(/_width_/i, options.width);
  query = query.replace(/_height_/i, options.height);
  url = url.replace(/_query_/i, encodeURI(query));
  nightmare
    .goto(url)
    .wait(config[origin].first_step)
    .evaluate(
      (config, origin) => {
        const arr = document.querySelectorAll(config[origin].first_step);
        arr[Math.floor(Math.random() * arr.length)].click();
      },
      config,
      origin
    )
    .wait(2000)
    .then(() => {
      if (null == config[origin].final_step) {
        return nightmare.evaluate(
          (config, origin) => {
            const arr = document.querySelectorAll(config[origin].first_step);
            if ("srcset" == config[origin].method)
              return arr[Math.floor(Math.random() * arr.length)].srcset;
            return "";
          },
          config,
          origin
        );
      } else {
        return nightmare.wait(config[origin].final_step).evaluate(
          (config, origin) => {
            return document
              .querySelector(config[origin].final_step)
              .getAttribute("src");
          },
          config,
          origin
        );
      }
    })
    .then((img) => {
      const path = homedir() + "/pastarr/";
      try {
        fs.accessSync(path);
      } catch (e) {
        fs.mkdirSync(path);
      }
      const ext = ".png";
      const uniq = new Date().getTime();
      if (img.startsWith("http")) {
        fetch(img).then((res) => {
          const dest = fs.createWriteStream(path + uniq + ext);
          res.body.pipe(dest);
          res.body.on("end", () => {
            wallpaper
              .set(path + uniq + ext, {
                scale: "fill",
                screen: 'all'
              })
              .then(() => {
                console.log("done ! (" + path + uniq + ext + ")");
                process.exit(1);
              });
          });
        });
      } else {
        base64ToImage(img, path, {
          fileName: uniq,
          type: 'png'
        });
        wallpaper
          .set(path + uniq + ext, {
            scale: "fill",
            screen: 'main'
          })
          .then(() => {
            console.log("done ! (" + path + uniq + ext + ")");
            process.exit(1);
          });
      }
    })
    .then(() => {
      nightmare.end;
    });
}