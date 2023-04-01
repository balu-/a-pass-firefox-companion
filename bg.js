console.log("-- inside js file --");

function logURL(requestDetails) {
    try {
        const url = new URL(requestDetails.url);
        //console.log(`Loading: ${requestDetails.url}`);
        //console.log(`url ${url}`)
        const hash = url.hash.substring(1);
        //console.log(`hash ${hash}`)
        const hash_dec = decodeURI(hash)
        console.log(`hash_dec ${hash_dec}`)
        //const json = JSON.parse(hash_dec) 
        //console.log(`json ${json}`)
        hash_url = new URL("https://addon.a-pass.de/?"+hash_dec);
        //console.log(`hash_url ${hash_url}`)
      return { redirectUrl: hash_url.searchParams.get('url') };
    }
    catch(err) {
        console.log(err);
        return { redirectUrl: "http://web.de" };
    }
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
  {urls: ["*://a-pass.de/*", "*://*.a-pass.de/*"]},
  ["blocking"]
);

console.log("- Installed -");