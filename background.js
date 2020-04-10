var opened = false;
var pluginPanelId = null

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
                url: tab.url
            });
        }
    }
    browser.runtime.sendMessage({
        msg: "results-complete",
    });
}

function createNewWindow() {
    let createData = {
        type: "detached_panel",
        url: "find-tab.html",
        width: window.screen.width / 2, // find reasonable size
        height: window.screen.height / 2
    };
    let pluginPanel = browser.windows.create(createData);
    waitForPanelId(pluginPanel)
    opened = true;
};

async function waitForPanelId(pluginPanel) {
    pluginPanelId = await pluginPanel.then(pluginPanel => pluginPanel.id);
}

browser.browserAction.onClicked.addListener(() => {
    // check if already open
    if (opened)
        return;
    createNewWindow();
});

browser.commands.onCommand.addListener(function (command) {
    if (opened)
        return;

    if (command == "toggle-plugin") {
        createNewWindow();
    }
});