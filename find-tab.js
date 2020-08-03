let backgroundPage = browser.extension.getBackgroundPage();
let find_input = document.getElementById("find-input");
let result_list = document.getElementById("result-list"); // to avoid FF errors, they have to be obtained each time
let modeIndicator = document.getElementById("mode-indicator");
let tabsListLastWindow = null;
let tabsListAllWindows = null;

let searchThroughLastWindow = false;
let selected = null;

// Since FF 89 callbacks have to be registered before background scripts calls the callback func
// sort the list on the fly, most occurences matching listed first, how about near matches?
browser.runtime.onMessage.addListener(handleMessage);
browser.windows.onRemoved.addListener(handlePanelClose);

// On lost focus, close
window.addEventListener("blur", closeWidget); 

// request all tabs from the bg script
backgroundPage.sendTabs();


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
                        if (result_list.childElementCount)
                        {
                            selected = { 
                                "idx" : 0,
                                "val" : result_list.firstChild
                            };
                            selected.val.classList.add("Selected");
                        } else {
                            selected = null;
                        }
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
        }
    }
});

// prevent popping up the textinput
document.addEventListener("keydown", function(e) {
    switch (e.key) {
        case "Enter":
            e.preventDefault();
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
            e.preventDefault();
            closeWidget();
        break;

        case "ArrowUp":
            e.preventDefault();
            selectPreceding(); 
        break;

        case "ArrowDown":
            e.preventDefault();
            selectSuceeding();
        break;
    }
});

window.addEventListener("keyup", function(e) {
    if (e.key == "Escape") {
        browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
    }
    e.preventDefault();
});

function find(query) {
    result_list.innerHTML = '';
    
    if (!query)
        return;
    
    let this_tab_url = browser.runtime.getURL("find-tab.html");
    let tabsList = searchThroughLastWindow ? tabsListLastWindow : tabsListAllWindows;
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
            selected.val.scrollIntoView(true);
        }
}

function handleMessage(request, sender, sendResponse) {
    if(request.msg == "all-tabs")
    {
        tabsListLastWindow = request.tabsLastW;
        tabsListAllWindows = request.tabsAllW;
    }
    else if (request.msg == "close-tab") {
        let currentSelected = selected.val;
        index = 0;
        for (index; index<result_list.childElementCount; ++index) {
            if (result_list.childNodes[index] == currentSelected)
                break;
        }

        browser.tabs.remove(parseInt(currentSelected.children[2].innerHTML));
        result_list.removeChild(currentSelected); // remove from the table
        // remove from array of all tabs 
        idCurrentSelected = parseInt(currentSelected.lastChild.innerText);
        tabsListAllWindows.splice(tabsListAllWindows.findIndex(el => el.id === idCurrentSelected), 1);
        let indexInCurrWindow = tabsListLastWindow.findIndex(el => el.id === idCurrentSelected);

        if (indexInCurrWindow !== -1) {
            tabsListLastWindow.splice(indexInCurrWindow, 1);
        } 

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
    else if (request.msg == "toggle-search-mode") {
        updateSearchMode();
    }
}

function updateSearchMode() {
    searchThroughLastWindow = !searchThroughLastWindow;
    find_input.placeholder = 'Search through: ' + (searchThroughLastWindow ? 'Last Window' : 'All Windows');
    modeIndicator.innerText = searchThroughLastWindow ? 'C' : 'A';
    find(find_input.value);
}

function selectPreceding() {
    if (selected.idx > 0) {
        selected.val.classList.remove("Selected"); //remove Selected class from prev selected
        selected = {
            "idx" : selected.idx -= 1,
            "val" : result_list.children[selected.idx]
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
        selected.val.scrollIntoView(true);
    }
    else if (result_list.childElementCount > 1) {
        selected.val.classList.remove("Selected");
        selected = {
            "idx" : result_list.childElementCount - 1,
            "val" : result_list.lastChild
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
        selected.val.scrollIntoView(true);
    }
}

function selectSuceeding() {
    let size = result_list.childElementCount;
    if (selected.idx < size - 1) {
        selected.val.classList.remove("Selected"); // remove Selected class from prev selected
        selected = {
            "idx" : selected.idx += 1,
            "val" : result_list.children[selected.idx]
        };
        selected.val.classList.add("Selected"); // add Selected class to new selected
        selected.val.scrollIntoView(true);
    }
    else if (result_list.childElementCount > 1) {
        selected.val.classList.remove("Selected");
        selected = {
            "idx" : 0,
            "val" : result_list.firstChild
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