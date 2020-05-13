let backgroundPage = browser.extension.getBackgroundPage();
let find_input = document.getElementById("find-input");
let result_list = document.getElementById("result-list"); // to avoid FF errors, they have to be obtained each time
let tabsList = null;

let timeout = null;
let selected = null;

// request all tabs from the bg script
backgroundPage.sendTabs();

// hack to ignore reload on 'Enter' Keypress in form field
document.getElementById("find-form").addEventListener("keypress", function(e) {
    if (e.key === "Enter")
        e.preventDefault();
});

document.getElementById("find-form").addEventListener("keyup", function(e) {
    if (e.key !== "Enter" && e.key !== "Escape" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        if (result_list.childElementCount > 0 && e.key !== "Backspace") {
            // refilter results if have some already instead of collecting them again
            const regex = RegExp(find_input.value);
            // Use while loop, sice index is not preserved correctly in for in loop when elements are removed
            let i = 0;
            while (i < result_list.childNodes.length)
            {
                let tab = result_list.childNodes[i];
                let innerT = tab.getElementsByTagName("td")[0].innerText;
                if (!innerT.toLowerCase().includes(find_input.value) && !regex.test(innerT)) {
                    if (tab.classList.contains("Selected")) {
                        result_list.removeChild(tab);
                        i -= 1;
                        selected = { 
                            "idx" : 0,
                            "val" : result_list.firstChild
                        };
                        selected.val.classList.add("Selected");
                    } else {
                        result_list.removeChild(tab);
                        i -= 1;
                    }
                }
                i += 1;
            }
        } else {
            selected = null;
            find(find_input.value);
            // TEST IF IT CAN BE WITH NO DELAY!!
            /*
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                //console.log("Pre find " + find_input.value);
                find(find_input.value);
            }, 300);*/
        }
        e.preventDefault();
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
    }
});

// prevent popping up the textinput
document.addEventListener("keyup", function(e) {
    switch (e.key) {
        case "Enter":
            if (selected)
            {
                //navigate to selected
                //console.log("Showing the tab: " + selected.val.children[2].innerHTML);
                browser.tabs.update(parseInt(selected.val.children[2].innerHTML),
                                    { active: true });
                
                closeWidget();
            } else if (find_input.value !== '')
            {
                // if no such tab exists, google it
                //console.log("Opening tab: " + find_input.value)
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
/*
function handleMessage(request, sender, sendResponse) {
    if (request.msg === "clear-results") {
        result_list.innerHTML = "";
    }
    if (request.msg === "found-result") {
        let tr = document.createElement("tr");
        let title = document.createElement("td");
        let url = document.createElement("td");
        let id = document.createElement("td");
        title.innerText = request.title;
        url.innerText = request.url;
        id.innerText = request.id;
        tr.appendChild(title);
        tr.appendChild(url);
        tr.appendChild(id);
        result_list.appendChild(tr);
    }
    if (request.msg === "results-complete") {
        //console.log("Obtained results for: " + request.query)
        //console.log(result_list);
        //console.log(result_list.hasChildNodes());
        //console.log(selected);
        if (result_list.hasChildNodes()) {
            selected = { 
                "idx" : 0,
                "val" : result_list.firstChild
            }
            //console.log("SELECTED: " + selected.val.innerText);
            // add Class Selected for CSS highlight
            selected.val.classList.add("Selected");
        }
    }
    if (request.msg == "close-tab") {
        console.log("Closing the selected tab!");
        let currentSelected = selected.val;
        index = 0;
        for (index; index<result_list.childElementCount; ++index) {
            if (result_list.childNodes[index] == currentSelected)
                break;
        }

        browser.tabs.remove(parseInt(currentSelected.children[2].innerHTML));
        result_list.removeChild(currentSelected);

        if (index > 0) {
            selectPreceding();
        } 
        else if (result_list.hasChildNodes()) {
            selected = { 
                "idx" : 0,
                "val" : result_list.firstChild
            }
            //console.log("SELECTED: " + selected.val.innerText);
            // add Class Selected for CSS highlight
            selected.val.classList.add("Selected");
        }
    }
}*/

function find(query) {
    result_list.innerHTML = '';
    
    if (!query)
        return;
    
    let this_tab_url = browser.runtime.getURL("find-tab.html");
    const regex = RegExp(query);
    for (let tab of tabsList)
    {
        if (tab.url == this_tab_url)
            continue;
        
            if (regex.test(tab.title) || tab.title.toLowerCase().includes(query)) {
                let tr = document.createElement("tr");
                let title = document.createElement("td");
                let url = document.createElement("td");
                let id = document.createElement("td");
                title.innerText = tab.title;
                url.innerText = tab.url;
                id.innerText = tab.id;
                tr.appendChild(title);
                tr.appendChild(url);
                tr.appendChild(id);
                result_list.appendChild(tr);
            }
    }
    if (result_list.hasChildNodes()) {
            selected = { 
                "idx" : 0,
                "val" : result_list.firstChild
            }
            //console.log("SELECTED: " + selected.val.innerText);
            // add Class Selected for CSS highlight
            selected.val.classList.add("Selected");
        }
}

function handleMessage(request, sender, sendResponse) {
    if(request.msg == "all-tabs")
    {
        tabsList = request.content;
        console.log(tabsList);
    }
    else if (request.msg == "close-tab") {
        console.log("Closing the selected tab!");
        let currentSelected = selected.val;
        index = 0;
        for (index; index<result_list.childElementCount; ++index) {
            if (result_list.childNodes[index] == currentSelected)
                break;
        }

        browser.tabs.remove(parseInt(currentSelected.children[2].innerHTML));
        result_list.removeChild(currentSelected);

        if (index > 0) {
            selectPreceding();
        } 
        else if (result_list.hasChildNodes()) {
            selected = { 
                "idx" : 0,
                "val" : result_list.firstChild
            }
            //console.log("SELECTED: " + selected.val.innerText);
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
        selected.val.scrollIntoView(true);
    }
}

function selectSuceeding() {
    let size = result_list.childElementCount;
    if (selected.idx !== size -1) {
        selected.val.classList.remove("Selected"); // remove Selected class from prev selected
        selected = {
            "idx" : selected.idx += 1,
            "val" : result_list.children[selected.idx]
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
        selected.val.scrollIntoView(true);
    }
}

function closeWidget() {
    let winID = browser.windows.WINDOW_ID_CURRENT;
    browser.windows.remove(winID);
}

function handlePanelClose(windowId) {
    if (backgroundPage.pluginPanelId == windowId)
        backgroundPage.opened = false;
        
};

// sort the list on the fly, most occurences matching listed first, how about near matches?
browser.runtime.onMessage.addListener(handleMessage);

browser.windows.onRemoved.addListener(handlePanelClose);
// On lost focus, close
//window.addEventListener("blur", closeWidget); 