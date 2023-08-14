//map url -> tab
const dataMap = new Map();
console.log("-- inside js file --");
/** declear stuff **/

const extensionId = chrome.runtime.id;

function portDisconnect(p){
    console.log('Disconnected from native app');
    console.log(p);
    console.log("Port");
    console.log(port);
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
  console.log("Create Port");
    var port = chrome.runtime.connectNative('apasscompanion');
    port.onDisconnect.addListener(portDisconnect);
    /*
      Listen for messages from the app.
      */
      port.onMessage.addListener(async (response) => {
        console.log("Received: ");
        //console.log(response);
        if (response['error']){
          console.error("Some error occured: "+response['msg']+" - "+response['url']);
          //cleanup
          // get tab 
          const tab = dataMap.get(response['url']);
          //delete tab from map
          dataMap.delete(response['url']);
        } else {
          //remap obj to have only this entrys
          const resp = { 'url': response['url'], 'user': response['user'], 'pw': response.pw };
          // get tab 
          const tab = dataMap.get(response['url']);
          //delete tab from map
          dataMap.delete(response['url']);
          const makeItGreen = function(){ document.body.style.border = "5px solid green"};
          //code: `window.browserpass.fillLogin(${JSON.stringify(request)});`,
          const executing = browser.scripting.executeScript({
            target: {
                  tabId: tab.id,
            },
            func: makeItGreen
          });
          //send user and pw to tab
          const sendMsg = browser.tabs.sendMessage(tab.id, resp);
          sendMsg.then((result) => {console.log("done");}, (error) => { console.log("error"); console.log(error); console.log(error.stack) });
          //execution only works if in the same tab as the action
        }
      });

    return port;
}
var port = undefined; //starte disconnected //createPort();

/*
On a click on the browser action, send the app a message.
*/

browser.action.onClicked.addListener(async (tab) => {
      let url = new URL(tab.url); //tab.url;
      url = url.origin;
      console.log(url);
      //inject script 
      try{
        
        const injectScript = browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          files: [ "in.js" ]
        });
        injectScript.then((result) => {
          //console.log("done inject with res:");
          //console.log(result); 
          //check for forms
          const sendMsg = browser.tabs.sendMessage(tab.id, {'url': url, 'action':'findForms'});
          //console.log("send msg "+tab.id);
          sendMsg.then((result) => {
            //successfull 
            //console.log("done "+result);
            if (result){
              //forms gefunden
              console.log("Sending: {'url': "+url+"}");
              try{
                 dataMap.set(url, tab);
                  if(port === undefined){
                    port = createPort(); //try to connect
                  }
                  rPromise = port.postMessage({ "url": url });
               } catch(error){
                console.error(error);
              }
              

            } else {
              console.log("Could not find forms - alert user");
              browser.tabs.sendMessage(tab.id, {'url': url, 'action':'alert', 'message': 'Could not find loginforms in page'});
              
            }
          }, (error) => { console.log("error"); console.log(error); console.log(error.stack) });
           //execution only works if in the same tab as the action
        }, (error) => {
         console.log("error"); console.log(error); 
       });
        
      } catch(error){
        console.error(error);
      }
});
