// Style setting:
function setStyle(theme) {
    let documentBody = document.body;
    let inputFieldStyle = document.getElementById("find-input").style;
    let generalBodyStyle = document.body.style;

    let sSheets = document.styleSheets[0];
    // General body style
    if (theme.colors && theme.colors.popup) {
        // BG color
        generalBodyStyle.backgroundColor = theme.colors.popup;
      }
    
    if (theme.colors && theme.colors.toolbar_field_text) {
        // default text color
        generalBodyStyle.color = theme.colors.toolbar_field_text;
        inputFieldStyle.color = theme.colors.toolbar_field_text;
    } 

    // Input field style
    if (theme.colors && theme.colors.toolbar_field) {
       inputFieldStyle.backgroundColor = theme.colors.toolbar_field;
    }

    if (theme.colors && theme.colors.toolbar) {
      sSheets.insertRule("div#form {background-color: " + theme.colors.toolbar +";}",0);
    }
    
    // Table of options style
    if (theme.colors && theme.colors.popup_highlight) {
        sSheets.insertRule(".Selected {background-color: " + theme.colors.popup_highlight +";}", 0);
        //document.getElementsByClassName("Selected").style.backgroundColor = theme.colors.popup_highlight;
    } else {
      sSheets.insertRule(".Selected {background-color: Highlight;}",0);
    }

    if (theme.colors && theme.colors.popup_highlight_text) {
      sSheets.insertRule(".Selected {color: " + theme.colors.popup_highlight_text + ";}", 0);
    }

    
}

async function setInitialStyle() {
    const theme = await browser.theme.getCurrent();
    setStyle(theme);
}

setInitialStyle();

// style Listener
// NOT WORKING!!
browser.theme.onUpdated.addListener(async ({ theme, windowId }) => {
    const panelWindow = await browser.windows.getCurrent();
    /*
      Only update theme if it applies to the window the sidebar is in.
      If a windowId is passed during an update, it means that the theme is applied to that specific window.
      Otherwise, the theme is applied globally to all windows.
    */
    if (!windowId || windowId == panelWindow.id) {
      setStyle(theme);
    }
  });