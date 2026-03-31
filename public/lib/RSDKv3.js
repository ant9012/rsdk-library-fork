var Module = {
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv3',
            function () {
                console.log('EngineFS initialized');
                const splash = document.getElementById("splash");
                if (splash) {
                    splash.style.opacity = 0;
                    setTimeout(() => { splash.remove(); }, 1000);
                }
                RSDK_Init();
            });
    },
    print: (function () {
        var element = document.getElementById('output');
        if (element) element.value = '';
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

            console.log(text);
            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight;
            }
        };
    })(),
    canvas: (() => {
        // Don't grab canvas here — it may not exist yet.
        // Emscripten will find it by ID at runtime.
        return null;
    })(),
    setStatus: (text) => {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return;
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;

        if (m) {
            text = m[1];
        }

        console.log(text);
    },
    totalDependencies: 0,
    monitorRunDependencies: function (left) {
        Module.totalDependencies = Math.max(Module.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (Module.totalDependencies - left) + '/' + Module.totalDependencies + ')' : 'All downloads complete.');
    }
};
Module.setStatus('Downloading...');
window.onerror = () => {
    Module.setStatus('Exception thrown, see JavaScript console');

    Module.setStatus = (text) => {
        if (text) console.error('[post-exception status] ' + text);
    };
};

function RSDK_Init() {
    FS.chdir('/RSDKv3');

    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        _RSDK_Configure(settings.enablePlus, 0);
    }

    _RSDK_Initialize();
}
