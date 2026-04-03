var Module = {
    // ===== PTHREAD CONFIGURATION (CRITICAL) =====
    // This must be set BEFORE the WASM module loads
    mainScriptUrlOrBlob: new URL('./modules/RSDKv5U.js', document.baseURI).href,
    
    preRun: [
        function() {
            // Ensure directories exist before FS operations
            console.log('preRun: Setting up filesystem...');
        }
    ],
    
    onRuntimeInitialized: function () {
        console.log('Runtime initialized, waiting for FS...');
        TS_InitFS('RSDKv5U',
            function () {
                window.__engineConsoleAppend?.('[STATUS] EngineFS initialized');
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
        canvas.addEventListener("webglcontextlost", (e) => { 
            alert('WebGL context lost. You will need to reload the page.'); 
            e.preventDefault(); 
        }, false);
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
        Module.totalDependencies = Math.max(Module.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (Module.totalDependencies - left) + '/' + Module.totalDependencies + ')' : 'All downloads complete.');
    },
    
    // ===== PTHREAD WORKER CONFIGURATION =====
    locateFile: function(path, prefix) {
        // Ensure worker script loads from correct location
        if (path.endsWith('.worker.js')) {
            return './modules/' + path;
        }
        if (path.endsWith('.wasm')) {
            return './modules/' + path;
        }
        return prefix + path;
    }
};

Module.setStatus('Downloading...');

window.onerror = (msg, src, line, col, err) => {
    const text = `[FATAL] ${msg} (${src}:${line}:${col})`;
    console.error(text, err);
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
    try {
        FS.chdir('/RSDKv5U');
        window.__engineConsoleAppend?.('[STATUS] Working directory set to /RSDKv5U');
        
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            Module.ccall('RSDK_Configure', null, ['number', 'number'], [settings.enablePlus, 0]);
        }
        
        window.__engineConsoleAppend?.('[STATUS] Calling RSDK_Initialize...');
        
        Module.ccall('RSDK_Initialize', null, [], []);
        
        window.__engineConsoleAppend?.('[STATUS] RSDK_Initialize dispatched (loop runs via emscripten_set_main_loop)');
    } catch (e) {
        console.error('RSDK_Init failed:', e);
        window.__engineConsoleAppend?.('[ERROR] RSDK_Init failed: ' + e.message);
    }
}

// Debug: Check SharedArrayBuffer availability
if (typeof SharedArrayBuffer === 'undefined') {
    console.error('❌ SharedArrayBuffer is NOT available!');
    console.error('crossOriginIsolated:', window.crossOriginIsolated);
    window.__engineConsoleAppend?.('[ERROR] SharedArrayBuffer not available - pthreads will fail!');
    window.__engineConsoleAppend?.('[ERROR] crossOriginIsolated: ' + window.crossOriginIsolated);
} else {
    console.log('✓ SharedArrayBuffer is available');
    console.log('✓ crossOriginIsolated:', window.crossOriginIsolated);
    window.__engineConsoleAppend?.('[STATUS] SharedArrayBuffer available');
}
