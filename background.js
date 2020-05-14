var opened = false;
var pluginPanelId = null;
var tabsFromLastWindow = null;
var tabsFromAllWindows = null;

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

// Requests tabs, from all windows and the current one.
async function getTabs() {
    await browser.tabs.query({currentWindow: true}).then((allT) => {tabsFromLastWindow = allT});
    await browser.tabs.query({currentWindow: false}).then((allT) => {tabsFromAllWindows = allT});
}

function sendTabs() {
    browser.runtime.sendMessage({
        msg: "all-tabs",
        tabsLastW: tabsFromLastWindow,
        tabsAllW: tabsFromAllWindows
    });
}

// Listeners
browser.browserAction.onClicked.addListener(() => {
    // check if already open
    if (opened)
        return;
    createNewWindow();
    getTabs();
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
            getTabs();
        }
    }
    else if (command == "close-Tab") {
        if (opened)
            browser.runtime.sendMessage({msg: "close-tab"});
    }
    else if (command == "toggle-search-mode") {
        if (opened)
            browser.runtime.sendMessage({msg: "toggle-search-mode"});
    }
});
