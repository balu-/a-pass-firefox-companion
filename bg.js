//map url -> tab
const dataMap = new Map();

console.log("-- inside js file --");

const extensionId = chrome.runtime.id;

function portDisconnect(p){
    console.log('Disconnected from native app');
    console.log(p);
    if (p.error) {
      console.log(`Disconnected due to an error: ${p.error.message}`);
    }
    browser.tabs.create({
              "url": "/no_connection.html"
            });
    port = undefined; //reset port
}

function createPort() 
{
  var port = chrome.runtime.connectNative('apasscompanion');
  port.onDisconnect.addListener(portDisconnect);
  return port;
}

var port = createPort();


/*
Listen for messages from the app.
*/
port.onMessage.addListener((response) => {
  console.log("Received: ");
  console.log(response);
  //remap obj to have only this entrys
  const resp = { 'url': response['url'], 'user': response['user'], 'pw': response.pw };
  // get tab 
  const tab = dataMap.get(response['url']);
  //delete tab from map
  dataMap.delete(response['url']);
  const makeItGreen = 'document.body.style.border = "5px solid green"';
  //code: `window.browserpass.fillLogin(${JSON.stringify(request)});`,
  const executing = browser.tabs.executeScript({
    code: makeItGreen
  });
  //send user and pw to tab
  browser.tabs.sendMessage(tab.id, resp);
  //execution only works if in the same tab as the action
});

/*
On a click on the browser action, send the app a message.
*/
browser.browserAction.onClicked.addListener(() => {
  browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
      let tab = tabs[0]; // Safe to assume there will only be one result
      let url = new URL(tab.url); //tab.url;
      url = url.origin;
      console.log(url);
      console.log("Sending: {'url': "+url+"}");
      //safe tab to url
      dataMap.set(url, tab);
      if(port === undefined){
        port = createPort(); //try to connect
      }
      try{
        rPromise = port.postMessage({ "url": url });
        const injectScript = browser.tabs.executeScript({
          file: "in.js"
        });
        injectScript.then((result) => {console.log("done");}, (error) => { console.log("error"); console.log(error); });
        
      } catch(error){
        console.error(error);
      }
  }, console.error)
});