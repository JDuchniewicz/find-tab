let backgroundPage = browser.extension.getBackgroundPage();

let timeout = null;

document.getElementById("find-form").addEventListener('keyup', function(e) {
    let find_input = document.getElementById("find-input");
    switch (e.key) {
        case "Enter":

        break;
        case "Escape":
            let winID = browser.windows.WINDOW_ID_CURRENT;
            browser.windows.remove(winID);
        break;
    // otherwise move arrows up and down the selection and highlight
        case "ArrowUp":

        break;
        case "ArrowDown":

        break;
        default:
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                console.log(find_input.value);
                backgroundPage.find(find_input.value);
            }, 500)
        break;
    }
    e.preventDefault();
})

let results = document.getElementById("result-list");

function handleMessage(request, sender, sendResponse) {
    if (request.msg === "clear-results") {
        results.innerHTML = "";
    }
    if (request.msg === "found-result") {
        let li = document.createElement("li");
        li.innerText = request.title + " @ " + request.url; // how to store url for clicking? dunno yet: separate it somewhere or keep hidden in var
        results.appendChild(li);
    }
} 
// sort the list on the fly, most occurences matching listed first, how about near matches?
browser.runtime.onMessage.addListener(handleMessage);