async function find(query) {
    browser.runtime.sendMessage({msg: "clear-results"});

    let this_tab_url = browser.runtime.getURL("find-tab.html");
    let tabs = await browser.tabs.query({}).then(allTabs => findMatchingTab(query, allTabs));

}

async function findMatchingTab(query, allTabs) {
    for (let tab of allTabs) {
        let result = await browser.find.find(query, {tabId: tab.id});
        browser.runtime.sendMessage({
            msg: "found-result",
            title: tab.title,
            id: tab.id,
            url: tab.url
        });
    }
}

browser.browserAction.onClicked.addListener(() => {
    let createData = {
        type: "detached_panel",
        url: "find-tab.html",
        width: 250, // find reasonable size
        height: 100
    };
    browser.windows.create(createData);
});