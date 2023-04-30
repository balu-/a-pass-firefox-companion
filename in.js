(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

function fillUserAndPassword(message){
	// ensure the origin is the same, or ask the user for permissions to continue
    if (window.location.origin !== message['url']) {
    	confirm("Origin miss match");
    } else {
    	fillForm(message);
    }
}
browser.runtime.onMessage.addListener(fillUserAndPassword);

const FORM_MARKERS = ["login", "log-in", "log_in", "signin", "sign-in", "sign_in"];

const USERNAME_FIELDS = {
    selectors: [
        "input[autocomplete=username i]",
        "input[name=login i]",
        "input[name=user i]",
        "input[name=username i]",
        "input[name=email i]",
        "input[name=alias i]",
        "input[id=login i]",
        "input[id=user i]",
        "input[id=username i]",
        "input[id=email i]",
        "input[id=alias i]",
        "input[class=login i]",
        "input[class=user i]",
        "input[class=username i]",
        "input[class=email i]",
        "input[class=alias i]",
        "input[name*=login i]",
        "input[name*=user i]",
        "input[name*=email i]",
        "input[name*=alias i]",
        "input[id*=login i]",
        "input[id*=user i]",
        "input[id*=email i]",
        "input[id*=alias i]",
        "input[class*=login i]",
        "input[class*=user i]",
        "input[class*=email i]",
        "input[class*=alias i]",
        "input[type=email i]",
        "input[autocomplete=email i]",
        "input[type=text i]",
        "input[type=tel i]",
    ],
    types: ["email", "text", "tel"],
};
const PASSWORD_FIELDS = {
    selectors: [
        "input[type=password i][autocomplete=current-password i]",
        "input[type=password i]",
    ],
};

/**
 * Query all visible elements
 *
 * parent element to query
 * field selectors to search for
 * form search only within this form
 * result is a list of search results
 */
function queryAllVisible(parent, field, form) {
    const result = [];
    for (let i = 0; i < field.selectors.length; i++) {
        let elems = parent.querySelectorAll(field.selectors[i]);
        for (let j = 0; j < elems.length; j++) {
            let elem = elems[j];
            // Select only elements from specified form
            if (form && form != elem.form) {
                continue;
            }
            // Ignore disabled fields
            if (elem.disabled) {
                continue;
            }
            // Elem or its parent has a style 'display: none',
            // or it is just too narrow to be a real field (a trap for spammers?).
            if (elem.offsetWidth < 30 || elem.offsetHeight < 10) {
                continue;
            }
            // We may have a whitelist of acceptable field types. If so, skip elements of a different type.
            if (field.types && field.types.indexOf(elem.type.toLowerCase()) < 0) {
                continue;
            }
            // Elem takes space on the screen, but it or its parent is hidden with a visibility style.
            let style = window.getComputedStyle(elem);
            if (style.visibility == "hidden") {
                continue;
            }
            // Elem is outside of the boundaries of the visible viewport.
            let rect = elem.getBoundingClientRect();
            if (
                rect.x + rect.width < 0 ||
                rect.y + rect.height < 0 ||
                rect.x > window.innerWidth ||
                rect.y > window.innerHeight
            ) {
                continue;
            }
            // Elem is hidden by its or or its parent's opacity rules
            const OPACITY_LIMIT = 0.1;
            let opacity = 1;
            for (
                let testElem = elem;
                opacity >= OPACITY_LIMIT && testElem && testElem.nodeType === Node.ELEMENT_NODE;
                testElem = testElem.parentNode
            ) {
                let style = window.getComputedStyle(testElem);
                if (style.opacity) {
                    opacity *= parseFloat(style.opacity);
                }
            }
            if (opacity < OPACITY_LIMIT) {
                continue;
            }
            // This element is visible, will use it.
            result.push(elem);
        }
    }
    return result;
}

/**
 * Query first visible element
 *
 * Parent element to query
 * Selectors to search for
 * Search only within this form
 * result is first search result
 */
function queryFirstVisible(parent, field, form) {
    var elems = queryAllVisible(parent, field, form);
    return elems.length > 0 ? elems[0] : undefined;
}


/**
 * find all forms
 * array of forms or undefined
 */
function findForms(){
	const forms = [];
	const elems = queryAllVisible(document, { selectors: PASSWORD_FIELDS.selectors.concat(USERNAME_FIELDS.selectors) }, undefined);
    for (let elem of elems) {
        const form = elem.form;
        if (form && forms.indexOf(form) < 0) {
            forms.push(form);
        }
    }

     // Try to filter only forms that have some identifying marker
    const markedForms = [];
    for (let form of forms) {
        const props = ["id", "name", "class", "action"];
        for (let marker of FORM_MARKERS) {
            for (let prop of props) {
                let propValue = form.getAttribute(prop) || "";
                if (propValue.toLowerCase().indexOf(marker) > -1) {
                    markedForms.push(form);
                }
            }
        }
    }

    // Try to filter only forms that have a password field
    const formsWithPassword = [];
    for (let form of markedForms) {
        if (queryFirstVisible(document, PASSWORD_FIELDS, form)) {
            formsWithPassword.push(form);
        }
    }

    // Give up and return the first available form, if any
    if (formsWithPassword.length > 0) {
        return formsWithPassword;
    }
    if (markedForms.length > 0) {
        return markedForms;
    }
    if (forms.length > 0) {
        return forms;
    }
    return undefined;
}

/**
 * set Field value
 * field 			selector
 * value 			string value to be set
 * form 			outer dom element (formular)
 * result is true if value is set
 */
function setFieldValue(field, value, form) {
    if (value === undefined) {
    	console.log("missing value");
        return true;
    }

    // Focus the input element first
    let el = queryFirstVisible(document, field, form);
    if (!el) {
    	console.error("could not find elm");
        return false;
    }
    for (let eventName of ["click", "focus"]) {
        el.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    // Focus may have triggered unvealing a true input, find it again
    el = queryFirstVisible(document, field, form);
    if (!el) {
    	console.error("could not refind elm");
        return false;
    }

    // Focus the potentially new element again
    for (let eventName of ["click", "focus"]) {
        el.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    // Send some keyboard events indicating that value modification has started (no associated keycode)
    for (let eventName of ["keydown", "keypress", "keyup", "input", "change"]) {
        el.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    // truncate the value if required by the field
    if (el.maxLength > 0) {
        value = value.substr(0, el.maxLength);
    }

    // Set the field value
    let initialValue = el.value || el.getAttribute("value");
    el.setAttribute("value", value);
    el.value = value;

    // Send the keyboard events again indicating that value modification has finished (no associated keycode)
    for (let eventName of ["keydown", "keypress", "keyup", "input", "change"]) {
        el.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    // re-set value if unchanged after firing post-fill events
    // (in case of sabotage by the site's own event handlers)
    if ((el.value || el.getAttribute("value")) === initialValue) {
        el.setAttribute("value", value);
        el.value = value;
    }

    // Finally unfocus the element
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
}

/**
 * Find form and fill credentials
 * credentials object containing pw and user fields to be filled
 */
function fillForm(credentials){
	console.log("fillForm");
    loginForm = findForms();
   	console.log(loginForm);
    for(let form of loginForm){
    	// fill login field
        if ('user' in credentials){
        	setFieldValue(USERNAME_FIELDS, credentials['user'], form);
        }
        // fill secret field
        if ('pw' in credentials){
            setFieldValue(PASSWORD_FIELDS, credentials['pw'], form)
        }
    }
}

})();


