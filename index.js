#!/usr/bin/env node
import { program } from "commander";
import base64ToImage from "base64-to-image";
import { setWallpaper } from "wallpaper";
import axios from "axios";
import * as cheerio from "cheerio";
import homedir from "homedir";
import fs from "fs";
import { isGeneratorFunction } from "util/types";

const config = {
  google: {
    url: "https://www.google.com/search?q=_query_&tbm=isch&source=hp&biw=1920&bih=983&dpr=1",
    search: "_search_ imagesize:_width_x_height_",
    steps: ["a.wXeWr img"],
    method: "data-src",
  },
  unsplash: {
    url: "https://unsplash.com/s/photos/_query_?orientation=landscape",
    search: "_search_",
    steps: ['a[itemprop="contentUrl"] img'],
    method: "srcset",
  },
  deviantart: {
    url: "https://www.deviantart.com/search?q=wallpaper%20_query_",
    search: "_search_ _width_x_height_",
    steps: ['a[data-hook="deviation_link"]', 'div[data-hook="art_stage"] img'],
    method: "src",
  },
  // pixabay: {
  //   url: "https://pixabay.com/images/search/_query_&",
  //   search: "_search_/?min_width=_width_&min_height=_height_",
  //   steps: [".results--efirA a.link--h3bPW", "#media_container img"],
  //   method: "srcset",
  // },
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

const axiosHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0",
  "Accept-Language": "fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3",
};

const defineWallpaper = (img) => {
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
      headers: axiosHeaders,
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
};

const doStep = ($, i, nbStep, origin) => {
  const arr = [];
  $(config[origin].steps[i]).each((_idx, el) => {
    if (i == nbStep) {
      if (el.attribs.alt.startsWith("http")) {
        arr.push(el.attribs.alt);
      } else {
        arr.push(el.attribs[config[origin].method]);
      }
    } else arr.push(el.attribs.href);
  });
  const link = arr[Math.floor(Math.random() * arr.length)];
  if (i == nbStep) {
    defineWallpaper(link);
  } else {
    axios({ url: link, method: "get", headers: axiosHeaders }).then(
      ({ data }) => {
        const $ = cheerio.load(data);
        doStep($, i + 1, nbStep, origin);
      }
    );
  }
};

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
  const { data } = await axios({
    url: url,
    method: "get",
    headers: axiosHeaders,
  });
  const $ = cheerio.load(data);
  const nbStep = config[origin].steps.length - 1;
  doStep($, 0, nbStep, origin);
}
