var Module = {
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv4',
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
        if (element) element.value = ''; // clear browser cache
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

            console.log(text);
            window.__engineConsoleAppend?.(text);
            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight; // focus on bottom
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
        if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;

        if (m) {
            text = m[1];
        }

        console.log(text);
        window.__engineConsoleAppend?.('[STATUS] ' + text);

        // statusElement.innerHTML = text;
    },
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};
Module.setStatus('Downloading...');

window.onerror = (event, source, lineno, colno, error) => {
    var msg = "Error: " + event;
    if (error && error.stack) msg += "\n" + error.stack;
    
    // Send to console.error so our React Hook catches it!
    console.error(msg); 
    window.__engineConsoleAppend?.(`[FATAL] ${msg}`);
    
    Module.setStatus('Exception thrown: ' + event);
    Module.setStatus = (text) => {
        if (text) {
            console.error('[post-exception status] ' + text);
            window.__engineConsoleAppend?.('[ERROR] ' + text);
        }
    };
};

function RSDK_Init() {
    FS.chdir('/RSDKv4');
    window.__engineConsoleAppend?.('[STATUS] Working directory set to /RSDKv4');

    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);

        // value, index
        // index 0 - plus
        // index 1 - device profile
        _RSDK_Configure(settings.enablePlus, 0);

        switch (settings.deviceProfile) {
            case "mobile":
                _RSDK_Configure(1, 1);
                break;
            default:
                _RSDK_Configure(0, 1);
                break;
        }        
    }

    window.__engineConsoleAppend?.('[STATUS] Calling RSDK_Initialize...');
    _RSDK_Initialize();
}

// Add this to the bottom of your script
window.addEventListener('mousedown', function() {
    // 1. Resume the Web Audio Context (JS Side)
    if (typeof SDL2 !== 'undefined' && SDL2.audioContext) {
        if (SDL2.audioContext.state === 'suspended') {
            SDL2.audioContext.resume().then(() => {
                console.log("Web AudioContext Resumed");
                window.__engineConsoleAppend?.('[STATUS] Web AudioContext Resumed');
            });
        }
    }

    // 2. Call the C++ Wake Function (Engine Side)
    // This tells SDL to unpause the audio device
    try {
        Module.ccall('Mono_WakeAudio', null, [], []);
    } catch (e) {
        // Function might not be exported yet or failed
    }
}, { once: false }); // Set to false so it catches clicks if focus is lost/regained
