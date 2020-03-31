async function find(query) {
    browser.runtime.sendMessage({msg: "clear-results"});

    if (!query)
        return;

    let this_tab_url = browser.runtime.getURL("find-tab.html");
    let tabs = await browser.tabs.query({}).then(allTabs => findMatchingTab(query, allTabs));

}

async function findMatchingTab(query, allTabs) {
    const regex = RegExp(query);
    for (let tab of allTabs) {
        // searching through all webpage sucks/skim titles for now?
        if (regex.test(tab.title) || tab.title.toLowerCase().includes(query)) {
            console.log(tab.title);
            browser.runtime.sendMessage({
                msg: "found-result",
                title: tab.title,
                id: tab.id,
                url: tab.url
            });
        }
    }
}

browser.browserAction.onClicked.addListener(() => {
    let createData = {
        type: "detached_panel",
        url: "find-tab.html",
        width: 400, // find reasonable size
        height: 300
    };
    browser.windows.create(createData);
});