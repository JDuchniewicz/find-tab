let backgroundPage = browser.extension.getBackgroundPage();
let find_input = document.getElementById("find-input");
let result_list = document.getElementById("result-list"); // to avoid FF errors, they have to be obtained each time

let timeout = null;
var selected = null;

// hack to ignore reload on 'Enter' Keypress in form field
document.getElementById("find-form").addEventListener("keypress", function(e) {
    if (e.key === "Enter")
        e.preventDefault();
});

document.getElementById("find-form").addEventListener("keyup", function(e) {
    if (e.key !== "Enter" && e.key !== "Escape" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        selected = null;
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            console.log(find_input.value); // log
            backgroundPage.find(find_input.value);
        }, 500);
        e.preventDefault();
    }
})

document.addEventListener("keypress", function(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
    }
})

// prevent popping up the textinput
document.addEventListener("keyup", function(e) {
    switch (e.key) {
        case "Enter":
            //navigate to selected
            console.log("Showing the tab: " + selected.val.children[2].innerHTML);
            console.log(typeof(selected.val.innerHTML[2].innerHTML))
            browser.tabs.update(parseInt(selected.val.children[2].innerHTML),
                                { active: true });
            closeWidget();
        break;

        case "Escape":
            closeWidget();
        break;

        case "ArrowUp":
            selectPreceding(); 
        break;

        case "ArrowDown":
            selectSuceeding();
        break;
    }
    e.preventDefault();
});

window.addEventListener("keyup", function(e) {
    if (e.key == "Escape") {
        browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
    }
    e.preventDefault();
});

function handleMessage(request, sender, sendResponse) {
    if (request.msg === "clear-results") {
        result_list.innerHTML = "";
    }
    if (request.msg === "found-result") {
        let tr = document.createElement("tr");
        let title = document.createElement("th");
        let url = document.createElement("th");
        let id = document.createElement("th");
        title.innerHTML = request.title;
        url.innerHTML = request.url;
        id.innerHTML = request.id;
        tr.appendChild(title);
        tr.appendChild(url);
        tr.appendChild(id);
        result_list.appendChild(tr);
    }
    if (request.msg === "results-complete") {
        //console.log(selected);
        // console.log(result_list.children);
        if (selected === null && result_list.hasChildNodes()) {
            //console.log(result_list.children);
            selected = { 
                "idx" : 0,
                "val" : result_list.firstChild
            };
            console.log(result_list.firstChild);
            console.log("SELECTED: " + selected.val.innerText);
        }
    }
} 

function selectPreceding() {
    if (selected.idx !== 0) {
        selected = {
            "idx" : selected.idx -= 1,
            "val" : result_list.children[selected.idx - 1]
        };
    }
}

function selectSuceeding() {
    let size = result_list.childElementCount;
    console.log(size);
    if (selected.idx !== size -1) {
        selected = {
            "idx" : selected.idx += 1,
            "val" : result_list.children[selected.idx + 1]
        };
    }
}

function closeWidget() {
    let winID = browser.windows.WINDOW_ID_CURRENT;
    browser.windows.remove(winID);
}
// sort the list on the fly, most occurences matching listed first, how about near matches?
browser.runtime.onMessage.addListener(handleMessage);