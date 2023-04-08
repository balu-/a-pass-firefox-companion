console.log("-- inside js file --");

//map hostname -> obj
const dataMap = new Map();

async function logURL(requestDetails) {
    try {
        if (requestDetails.type != "main_frame"){
            console.log("ignore non main_frame");
            return {};
        }
        console.log(requestDetails);
        const tab_id = requestDetails.tabId;
        const request_id = requestDetails.requestId;
        console.log(`Requests: ${tab_id} - ${request_id}`);
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
            const redirect_url = new URL(hash_url.searchParams.get('url'));
            // preinject add
             try {
                // browser.scripting.executeScript({
                //   target: {
                //     tabId: tab_id,
                //   },
                //   func: () => {
                //     document.body.style.border = "5px solid green";
                //   },
                // });
                dataMap.set(redirect_url.host, { 'user': hash_url.searchParams.get('user'), 'pw':hash_url.searchParams.get('pw')});
                const past_url = redirect_url.href.substring(redirect_url.protocol.length-1)
                await browser.scripting.registerContentScripts([{
                      id: "a-pass-content-"+redirect_url.host,
                      js: ["in.js"],
                      //url.protocol
                      matches: [ "*"+past_url ],
                }]);
              } catch (err) {
                console.error(`failed to execute script: ${err}`);
              }
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

browser.runtime.onMessage.addListener(
  (data, sender, senderResponse) => {
    console.log("Call - "+sender.url);

    //console.log(data);
    //console.log(sender);
    const redirect_url = new URL(sender.url);
    console.log("redirect "+redirect_url);
    //unregister
    browser.scripting.unregisterContentScripts({
                      ids:[ "a-pass-content-"+redirect_url.host ]});
    console.log("unregister");
    const dataObj = dataMap.get(redirect_url.host);
    dataMap.delete(redirect_url.host);
    console.log("dataMap");
    //console.log(dataMap);
    //console.log(dataObj);
    senderResponse({response: dataObj});
    return true;//dataObj;
    //todo send username & pw
  }
);

console.log("- Installed -");