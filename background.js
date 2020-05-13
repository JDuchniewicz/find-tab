var opened = false;
var pluginPanelId = null;
var tabs = null;

async function find(query) {
    browser.runtime.sendMessage({msg: "clear-results"});

    if (!query)
        return;

    let this_tab_url = browser.runtime.getURL("find-tab.html");
    let tabs = await browser.tabs.query({}).then(allTabs => findMatchingTab(query, allTabs, this_tab_url));

}

async function findMatchingTab(query, allTabs, thisTabUrl) {
    const regex = RegExp(query);
    for (let tab of allTabs) { // just search through tabs titles for now, maybe add in depth tab searching later?
        if (tab.url == thisTabUrl)
        {
            continue;
        }
        if (regex.test(tab.title) || tab.title.toLowerCase().includes(query)) {
            browser.runtime.sendMessage({
                msg: "found-result",
                title: tab.title,
                id: tab.id,
                url: tab.url,
                query: query
            });
        }
    }
    browser.runtime.sendMessage({
        msg: "results-complete"
    });
    //console.log("Handled find " + query);
}

function createNewWindow() {
    let createData = {
        type: "detached_panel",
        url: "find-tab.html",
        width: window.screen.width / 2, // find reasonable size
        height: window.screen.height / 2,
        // current bug 1271047 prevents from pos being set
        left: window.screen.width / 2, // position in the centre
        top: window.screen.height / 2
    };
    let pluginPanel = browser.windows.create(createData);
    waitForPanelId(pluginPanel);
    opened = true;
};

async function waitForPanelId(pluginPanel) {
    pluginPanelId = await pluginPanel.then(pluginPanel => pluginPanel.id);
}

// Listeners
browser.browserAction.onClicked.addListener(() => {
    // check if already open
    if (opened)
        return;
    createNewWindow();
    getTabs(true);
});

browser.commands.onCommand.addListener(function (command) {
   
    if (command == "toggle-plugin") {
        // Toggle the plugin on and off
        if (opened)
        {    
            browser.windows.remove(pluginPanelId); 
            // opened is set to false and handled by find-tab.js by handlePanelClose
        }
        else {
            createNewWindow();
            getTabs(true);
        }
    }
    
    else if (command == "close-Tab") {
        browser.runtime.sendMessage({
            msg: "close-tab"
        });
    }

});

// Requests tabs, either from all windows or the current one. Stores them in the tabs variable 
async function getTabs(lastWindow) {
    let allTabs = await browser.tabs.query({currentWindow: lastWindow}).then(allT => tabs = allT);
}

function sendTabs() {
    browser.runtime.sendMessage({
        msg: "all-tabs",
        content: tabs
    });
}