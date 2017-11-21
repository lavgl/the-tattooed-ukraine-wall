const axios = require('axios');

const INITIAL_URL = 'https://www.instagram.com/the_tattooed_ukraine/?__a=1';

function extractFromNode(node) {
  const {
    id,
    thumbnail_resources,
    likes: { count: likes },
    comments: { count: comments },
    caption
  } = node;

  const { src } = thumbnail_resources[0];

  const artist = extractArtistInfo(caption);

  return { id, src, likes, comments, artist };
}

function getMediaCount(response) {
  return response.user.media.count;
}

function getNextPageCursor(response) {
  const { has_next_page, end_cursor } = response.user.media.page_info;

  return has_next_page ? end_cursor : null;
}

function extractUsefulData(response) {
  const { nodes } = response.user.media;

  return nodes.map(extractFromNode);
}

function firstRequest() {
  return axios.get(INITIAL_URL);
}

function pageUrl(cursor) {
  return `${INITIAL_URL}&max_id=${cursor}`;
}

const ARTIST_INFO_REGEXP = /.+?:\s(.+? .+?), (.+)\n*(@.+)/;

function extractArtistInfo(caption) {
  const artistInfo = caption.split('___')[0];
  const result = artistInfo.match(ARTIST_INFO_REGEXP);

  return {
    name: result[1].trim(),
    city: result[2],
    nickname: result[3]
  };
}

function processResultAndScheduleRequest(promise, processResult) {
  return promise
    .then(({ data }) => {
      processResult(extractUsefulData(data));
      return axios.get(pageUrl(getNextPageCursor(data)));
    });
}

function main() {
  let result = [];
  const promise = firstRequest();

  for(let i = 0; i < 10; i++) {
    processResultAndScheduleRequest(promise, processed => result = result.concat(processed));
  }

  promise.then(() => {
    console.log(result);
  });
}

main();

// captions.forEach(c => {
//   const info = extractArtistInfo(c);
//   console.log(info);
// });