window.$ = window.jQuery = require('jquery');

const { remote } = require('electron');
const { Menu, BrowserWindow, MenuItem, shell } = remote;
const fs = require('fs');

var $body,
    $urlField,
    $browserView,
    $appControls,
    $windowChrome,
    $transparencyRange;

String.prototype.replacePrefix = function(prefix, repl) {
    if (this.startsWith(prefix)) {
        return repl + this.substr(prefix.length)
    } else {
        return this;
    }
}

$(() => {
    $body = $(document.body),
    $urlField = $('#urlField'),
    $browserView = $('#browserView'),
    $appControls = $('.app-controls'),
    $windowChrome = $('.window-chrome'),
    $transparencyRange = $('#transparencyRange');

    let webview = document.getElementById('browserView');
    webview.addEventListener('dom-ready', () => {
        webview.insertCSS('*::-webkit-scrollbar { width: 0 !important }');
    });

    webview.addEventListener('did-get-redirect-request', function(e) {
        if (e.isMainFrame) {
            $urlField.val(e.newURL);
        }
    });

    // Address bar form
    $('#addressBar').submit(e => {
        e.preventDefault();
        loadURL();
    });

    // Opacity Slider
    $transparencyRange.change(function() {
        let opacityValue = $(this).val();
        changeOpacity(opacityValue);
    });

    // Select all text when changing URL
    $("input[type='text']").click(function() {
       $(this).select();
    });
});

// Change Window Opacity
function changeOpacity(opacity) {
    $body.fadeTo('fast', opacity);
}

// App Controls
function loadURL() {
    let url = $urlField.val();

    if (!(url.startsWith('http'))) {
        url = `http://${url}`;
    }

    loadPage(url);
}

function magicURL(url) {
    let newUrl = url.replacePrefix("https://www.youtube.com/watch?v=", (url.includes('list') ? "https://www.youtube.com/embed/?v=" : "https://www.youtube.com/embed/"))
                    .replacePrefix("https://vimeo.com/", "http://player.vimeo.com/video/")
                    .replacePrefix("http://v.youku.com/v_show/id_", "http://player.youku.com/embed/")
                    .replacePrefix("https://www.twitch.tv/", "https://player.twitch.tv?html5&channel=")
                    .replacePrefix("http://www.dailymotion.com/video/", "http://www.dailymotion.com/embed/video/")
                    .replacePrefix("http://dai.ly/", "http://www.dailymotion.com/embed/video/");

    /*
    if (newUrl.includes("https://youtu.be")) {
        newUrl = "https://www.youtube.com/embed/" + getVideoHash(url);
        if url.containsString("?t=") {
            newUrl += makeCustomStartTimeURL(url);
        }
    }
    */

    return newUrl;
}


function loadPage(url) {
    url = magicURL(url);

    console.log('Loading', url);

    $urlField.val(url);

    let webview = document.getElementById('browserView');

    webview.loadURL(url);
}

// Go back
function browserBack() {
    let webview = document.getElementById('browserView');
    webview.goBack();
}

function enableClickThrough() {
    console.log('Clickthrough enabled.');

    let rWindow = remote.getCurrentWindow();
    rWindow.setIgnoreMouseEvents(true);

    $browserView.addClass('full-size');
    $appControls.slideUp(200, () => {
        $windowChrome.slideUp(200);
    });
}

remote.BrowserWindow.getFocusedWindow().on('minimize', event => {
    $body.fadeTo(0, 0.95);
    $transparencyRange.val(0.95);

    $browserView.removeClass('full-size');
    $windowChrome.slideDown(200, () => {
        $appControls.slideDown(200);
    });
    // remote.BrowserWindow.getAllWindows().setIgnoreMouseEvents(false);

    console.log("Clickthrough disabled");
});


// Window Controls
function openWebsite() {
    shell.openExternal("http://mitch.works/apps/glass");
}

function minimizeWindow() {
    remote.getCurrentWindow().minimize();
}

var windowIsMaximized = false;

function maximizeWindow() {
    let rWindow = remote.getCurrentWindow();
    const { width, height } = remote.screen.getPrimaryDisplay().workAreaSize;
    if (windowIsMaximized) {
        rWindow.setSize(800, 600);
    } else {
        rWindow.setSize(Math.ceil(width * .95), Math.ceil(height * .95));
        rWindow.setPosition(Math.ceil(width * .025), Math.ceil(height * .025))
    }
    windowIsMaximized = !windowIsMaximized;
}

function closeWindow() {
    remote.getCurrentWindow().close();
}
