#!/usr/bin/env node
import { program } from "commander";
import base64ToImage from "base64-to-image";
import { setWallpaper } from "wallpaper";
import axios from "axios";
import cheerio from "cheerio";
import homedir from "homedir";
import fs from "fs";

const config = {
  /*
  google: {
    url: "https://www.google.fr/search?q=_query_&tbm=isch&source=hp&biw=1920&bih=983",
    search: "_search_ imagesize:_width_x_height_",
    first_step: ".e3goi a",
    final_step: 'a[rlhc="1"] img',
  },
  deviantart: {
    url: "https://www.deviantart.com/search?q=wallpaper%20_query_",
    search: "_search_ _width_x_height_",
    first_step: 'a[data-hook="deviation_link"]',
    final_step: 'div[data-hook="art_stage"] img',
  },
  */
  unsplash: {
    url: "https://unsplash.com/s/photos/_query_?orientation=landscape",
    search: "_search_",
    first_step: 'a[itemprop="contentUrl"] img',
    final_step: null,
    method: "srcset",
  },
};

program
  .version("1.0.0")
  .usage("[options]")
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
    "unsplash"
  )
  .description("replace your wallpaper from CLI")
  .parse();

const options = program.opts();
if ("" == options.search) program.help();
else {
  const origin = options.origin;
  let url = config[origin].url;
  let query = config[origin].search;
  query = query.replace(/_search_/i, options.search);
  query = query.replace(/_width_/i, options.width);
  query = query.replace(/_height_/i, options.height);
  url = url.replace(/_query_/i, encodeURI(query));
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const arr = [];
  $(config[origin].first_step).each((_idx, el) => {
    if ("srcset" == config[origin].method) arr.push(el.attribs.srcset);
    else arr.push(el.attribs.href);
  });
  const img = arr[Math.floor(Math.random() * arr.length)];
  const path = homedir() + "/pastarr/";
  try {
    fs.accessSync(path);
  } catch (e) {
    fs.mkdirSync(path);
  }
  const ext = ".png";
  const uniq = new Date().getTime();
  if (img.startsWith("http")) {
    axios({
      method: "get",
      url: img,
      responseType: "stream",
    }).then((res) => {
      res.data.pipe(fs.createWriteStream(path + uniq + ext));
      res.data.on("end", () => {
        setWallpaper(path + uniq + ext, {
          scale: "fill",
          screen: "all",
        }).then(() => {
          console.log("done ! (" + path + uniq + ext + ")");
          process.exit(1);
        });
      });
    });
  } else {
    base64ToImage(img, path, {
      fileName: uniq,
      type: "png",
    });
    setWallpaper(path + uniq + ext, {
      scale: "fill",
      screen: "main",
    }).then(() => {
      console.log("done ! (" + path + uniq + ext + ")");
      process.exit(1);
    });
  }
}
