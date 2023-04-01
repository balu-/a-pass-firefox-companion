console.log("-- inside js file --");

function logURL(requestDetails) {
    try {
        const url = new URL(requestDetails.url);
        console.log(`Loading: ${requestDetails.url}`);
        //console.log(`url ${url}`)
        const hash = url.hash.substring(1);
        //console.log(`hash ${hash}`)
        const hash_dec = decodeURI(hash)
        //console.log(`hash_dec ${hash_dec}`)
        const hash_url = new URL("https://addon.a-pass.de/?"+hash_dec);
        //console.log(`hash_url ${hash_url}`)
        if (hash_url.searchParams.get('url') != null){
            return { redirectUrl: hash_url.searchParams.get('url') };
        } else {
            console.log("Could not get url");
            return { redirectUrl: "https://addon.a-pass.de/error" };
        }
    }
    catch(err) {
        console.log(err);
        return { redirectUrl: "https://addon.a-pass.de/error" };
    }
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
  {urls: ["*://a-pass.de/#*", "*://*.a-pass.de/#*"]},
  ["blocking"]
);

console.log("- Installed -");