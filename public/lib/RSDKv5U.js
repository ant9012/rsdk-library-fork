var Module = {
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv5U',
            function () {
                window.__engineConsoleAppend?.('[STATUS] EngineFS initialized');
                console.log('EngineFS initialized');
                const splash = document.getElementById("splash");
                splash.style.opacity = 0;
                setTimeout(() => { splash.remove(); }, 1000);
                RSDK_Init();
            });
    },
    print: (function () {
        var element = document.getElementById('output');
        if (element) element.value = '';
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            console.log(text);
            window.__engineConsoleAppend?.(text);
            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight;
            }
        };
    })(),
    printErr: function (text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.error(text);
        window.__engineConsoleAppend?.('[ERROR] ' + text);
    },
    canvas: (() => {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", (e) => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
        return canvas;
    })(),
    setStatus: (text) => {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return;
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;
        if (m) text = m[1];
        console.log(text);
        window.__engineConsoleAppend?.('[STATUS] ' + text);
    },
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};

Module.setStatus('Downloading...');

window.onerror = (msg, src, line, col, err) => {
    const text = `[FATAL] ${msg} (${src}:${line}:${col})`;
    console.error(text);
    window.__engineConsoleAppend?.(text);
    Module.setStatus('Exception thrown, see JavaScript console');
    Module.setStatus = (text) => {
        if (text) {
            console.error('[post-exception status] ' + text);
            window.__engineConsoleAppend?.('[ERROR] ' + text);
        }
    };
};

function RSDK_Init() {
    FS.chdir('/RSDKv5U');
    window.__engineConsoleAppend?.('[STATUS] Working directory set to /RSDKv5U');
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        // value, index
        // index 0 - plus
        _RSDK_Configure(settings.enablePlus, 0);
    }
    _RSDK_Initialize();
}
