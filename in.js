document.body.style.border = "5px solid green";
//console.log("HI")
//window.addEventListener("load", (event) => {
	//console.log("dom Loaded");
	window.setTimeout (function () {
       //some timeout
		console.log("timeout");
		function handleResponse(message) {
		  console.log(`Got user & pw payload`);
		  //console.log(message.response);
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
		  var userInputs = document.querySelectorAll("input[type='email'], input[type='text']");
		  console.log("userInput "+userInputs.length)

		  if(userInputs.length == 1){
		  	//we got it 
		  	console.log("set value ");
		  	userInputs[0].value = message.response.user;
		  	console.log(userInputs[0]);
		  } else if (userInputs.length > 1){
		  	var userInputs = document.querySelectorAll("input[type='email']");
		  	 if (userInputs.length > 0 && userInputs.length < 4 ){
			 	console.log("Todo refine");
			 	console.log(userInputs);

			 	for (var i = userInputs.length - 1; i >= 0; i--) {
			 		userInputs[i].value = message.response.user;
			 	}

			 } else if (userInputs.length < 1){
			 	var userInputs = document.querySelectorAll("input[type='text']");
			 	if (userInputs.length > 0 && userInputs.length < 4 ){
				 	console.log("Todo refine");
				 	console.log(userInputs);

				 	for (var i = userInputs.length - 1; i >= 0; i--) {
				 		userInputs[i].value = message.response.user;
				 	}

				 } 
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
	  //the event occurred
    }, 500); // wait 100 ms
//});