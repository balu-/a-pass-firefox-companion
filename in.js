document.body.style.border = "5px solid green";
//unregister self
// browser.scripting.unregisterContentScripts({
// 	ids: ["a-pass-content-"+document.URL.host],
// });
console.log("unregisterd self");
function handleResponse(message) {
  console.log(message.response);
  console.log(`Message from the background script: ${message.response}`);
  // todo get pw & user and fill
  // find all pw inputs
  var pwInput = document.querySelectorAll("input[type='password']");
  console.log("pwInput "+pwInput.length)
  if(pwInput.length == 1){
  	//we got it 
  	console.log("set value ");
  	pwInput[0].value = message.response.pw;
  }
  //find user inputs
  var userInput = document.querySelectorAll("input[type='email']");
  console.log("userInput "+userInput.length)
  if(userInput.length == 1){
  	//we got it 
  	console.log("set value ");
  	userInput[0].value = message.response.user;
  	console.log(userInput[0]);
  }
  if (userInput.length < 1){
  	  var userInput = document.querySelectorAll("input[type='text']");
	  console.log("userInput "+userInput.length)
	  if(userInput.length == 1){
	  	//we got it 
	  	console.log("set value ");
	  	userInput[0].value = message.response.user;
	  }
  }
  console.log(pwInput);
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

const sending = browser.runtime.sendMessage({
greeting: "Greeting from the content script",
});
 sending.then(handleResponse, handleError);