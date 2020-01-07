const fs = require('fs');
const util = require('util');
const path = require('path');
const csvParse = require('csv-parse');
const crypto = require('crypto');
const csvParsePromise = util.promisify(csvParse);
const dbDir = __dirname + '/../db/';

let hashMap = new Map();
let pages = [];

addWordToHashMap = word => {
  const id = hashMap.size;
  hashMap.set(word, id);
  return id;
};

getIdForWord = word => {
  if (hashMap.has(word)) {
    return hashMap.get(word);
  } else {
    return addWordToHashMap(word);
  }
};

getLocationScore = (page, query) => {
  let score = 0;
  let found = false;
  let words = query.split(' ');

  for (word of words) {
    const id = getIdForWord(word);
    for (word in page.words) {
      if (page.words[word] === id) {
        found = true;
        score += word;
      }
    }
  }
  if (!found) score += 1000000;
  return score;
};

getFrequencyScore = (page, query) => {
  let score = 0;
  let words = query.split(' ');

  for (word of words) {
    const id = getIdForWord(word);
    for (word of page.words) {
      if (word === id) {
        score++;
      }
    }
  }
  return score;
};

search = query => {
  getWords();
  console.log(query);
  let result = [];
  let scores = { content: [], location: [] };

  for (page in pages) {
    // for (i = 0; i < pages.length; i++) {
    scores.content[page] = getFrequencyScore(pages[page], query);
    scores.location[page] = getLocationScore(pages[page], query);
  }

  normalize(scores.content, false);
  normalize(scores.location, true);

  for (page in pages) {
    console.log(page);
    // let score = scores.content[page] + 0.8 * scores.location[page];
    let score = 1.0 * scores.content[page];
    result.push({ page: pages[page], score });
  }

  result.sort((b, a) => (a.score > b.score ? 1 : a.score < b.score ? -1 : 0));

  return result.slice(0, 5);
};

roundDecimals = (number, dec) => {
  return parseFloat(number).toFixed(dec);
};

normalize = (scores, smallIsBetter) => {
  if (smallIsBetter) {
    const min = scores.reduce((a, b) => {
      return Math.min(a, b);
    });

    for (score in scores) {
      scores[score] = roundDecimals(min / Math.max(scores[score], 0.00001), 2);
    }
  } else {
    const max = scores.reduce((a, b) => {
      return Math.max(a, b);
    });
    for (score in scores) {
      scores[score] = roundDecimals(scores[score] / max, 2);
    }
  }
  console.log(scores);
};

getWords = async () => {
  hashMap = new Map();
  pages = [];
  let dirs = [
    ...fs.readdirSync(dbDir + 'Words/Games').map(file => ({
      file,
      dir: 'Games',
    })),
    //path.join("/Games/" + file)),
    // .map(file => path.join(dbDir + "Words/Games/" + file)),
    ...fs.readdirSync(dbDir + 'Words/Programming').map(
      file => ({
        file,
        dir: 'Programming',
      }) /*path.join("/Programming/" + file)*/
    ),
    // .map(file => path.join(dbDir + "Words/Programming/" + file))
  ];
  let counter = 1;
  dirs.forEach(async ({ dir, file }) => {
    const content = fs.readFileSync(
      path.join(dbDir, 'Words', dir, file),
      'utf8'
    );
    let page = {};
    page.url = `/wiki/${file}`;
    page.name = file;
    page.words = [];
    for (word of content.split(' ')) {
      page.words.push(getIdForWord(word));
    }
    pages.push(page);
  });
  // console.log(hashMap);
  // console.log(pages);
  // console.log(hashMap);
  // await fs.writeFileSync("test.json", JSON.stringify(pages, null, 2));
};
//

module.exports = { getWords, search };
