let backgroundPage = browser.extension.getBackgroundPage();
let find_input = document.getElementById("find-input");
let result_list = document.getElementById("result-list"); // to avoid FF errors, they have to be obtained each time

let timeout = null;
let selected = null;

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
            if (selected)
            {
                //navigate to selected
                console.log("Showing the tab: " + selected.val.children[2].innerHTML);
                console.log(typeof(selected.val.innerHTML[2].innerHTML))
                browser.tabs.update(parseInt(selected.val.children[2].innerHTML),
                                    { active: true });
            
                        closeWidget();
            } else if (find_input.value !== '')
            {
                console.log("Opening tab: " + find_input.value)
                let newTab = {
                    active: true,
                    url: "https://www.google.com/search?q=" + find_input.value
                };
                browser.tabs.create(newTab);
                closeWidget();
            } else {
                closeWidget();
            }
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
        let title = document.createElement("td");
        let url = document.createElement("td");
        let id = document.createElement("td");
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
            console.log(result_list)
            console.log(result_list.firstChild);
            console.log("SELECTED: " + selected.val.innerText);
            // add Class Selected for CSS highlight
            selected.val.classList.add("Selected");
        }
    }
} 

function selectPreceding() {
    if (selected.idx !== 0) {
         selected.val.classList.remove("Selected"); //remove Selected class from prev selected
        selected = {
            "idx" : selected.idx -= 1,
            "val" : result_list.children[selected.idx]
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
    }
}

function selectSuceeding() {
    let size = result_list.childElementCount;
    console.log(size); // console log
    if (selected.idx !== size -1) {
        selected.val.classList.remove("Selected"); // remove Selected class from prev selected
        selected = {
            "idx" : selected.idx += 1,
            "val" : result_list.children[selected.idx]
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
    }
}

function closeWidget() {
    let winID = browser.windows.WINDOW_ID_CURRENT;
    browser.windows.remove(winID);
}
// sort the list on the fly, most occurences matching listed first, how about near matches?
browser.runtime.onMessage.addListener(handleMessage);