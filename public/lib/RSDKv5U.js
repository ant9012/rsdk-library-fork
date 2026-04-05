var Module = {
    // ===== PTHREAD CONFIGURATION (CRITICAL) =====
    mainScriptUrlOrBlob: new URL('./modules/RSDKv5U.js', document.baseURI).href,
    
    preRun: [
        function() {
            console.log('preRun: Setting up filesystem...');
        }
    ],
    
    onRuntimeInitialized: function () {
        console.log('Runtime initialized, waiting for FS...');
        
        // Check if TS_InitFS is available
        if (typeof window.TS_InitFS !== 'function') {
            console.error('TS_InitFS is not defined! Check script loading order.');
            window.__engineConsoleAppend?.('[ERROR] TS_InitFS not available');
            return;
        }
        
        // Delay FS init to give IDBFS time to mount properly
        setTimeout(() => {
            window.TS_InitFS('RSDKv5U', function () {
                window.__engineConsoleAppend?.('[STATUS] EngineFS initialized');
                console.log('EngineFS initialized');
                const splash = document.getElementById("splash");
                if (splash) {
                    splash.style.opacity = 0;
                    setTimeout(() => { splash.remove(); }, 1000);
                }
                RSDK_Init();
            });
        }, 500);
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
    
    locateFile: function(path, prefix) {
        if (path.endsWith('.worker.js')) {
            return './modules/' + path;
        }
        if (path.endsWith('.wasm')) {
            return './modules/' + path;
        }
        return prefix + path;
    }
};

// ===== INTERCEPT ALL CONSOLE METHODS =====
(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = function(...args) {
        const text = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        window.__engineConsoleAppend?.(text);
        originalLog.apply(console, args);
    };

    console.error = function(...args) {
        const text = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        window.__engineConsoleAppend?.('[ERROR] ' + text);
        originalError.apply(console, args);
    };

    console.warn = function(...args) {
        const text = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        window.__engineConsoleAppend?.('[WARNING] ' + text);
        originalWarn.apply(console, args);
    };

    console.info = function(...args) {
        const text = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        window.__engineConsoleAppend?.('[INFO] ' + text);
        originalInfo.apply(console, args);
    };

    console.debug = function(...args) {
        const text = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        window.__engineConsoleAppend?.('[DEBUG] ' + text);
        originalDebug.apply(console, args);
    };
})();

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

// ===== ENGINE INITIALIZATION =====
function RSDK_Init() {
    try {
        console.log('[RSDK] Changing directory to /RSDKv5U');
        FS.chdir('/RSDKv5U');
        window.__engineConsoleAppend?.('[STATUS] Working directory set to /RSDKv5U');
        
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            console.log('[RSDK] Loading stored settings');
            const settings = JSON.parse(storedSettings);
            Module.ccall('RSDK_Configure', null, ['number', 'number'], [settings.enablePlus, 0]);
        }
        
        window.__engineConsoleAppend?.('[STATUS] Calling RSDK_Initialize...');
        console.log('[RSDK] Calling RSDK_Initialize...');
        
        // Wrap in try-catch to see WHERE it fails
        try {
            Module.ccall('RSDK_Initialize', null, [], []);
            console.log('[RSDK] RSDK_Initialize completed');
        } catch (innerError) {
            console.error('[RSDK_Initialize] Crashed:', innerError);
            console.error('[RSDK_Initialize] Stack:', innerError.stack);
            window.__engineConsoleAppend?.('[ERROR] RSDK_Initialize crashed: ' + innerError.message);
            throw innerError;
        }
        
        window.__engineConsoleAppend?.('[STATUS] RSDK_Initialize dispatched (loop runs via emscripten_set_main_loop)');
    } catch (e) {
        console.error('RSDK_Init failed:', e);
        console.error('Full stack:', e.stack);
        window.__engineConsoleAppend?.('[ERROR] RSDK_Init failed: ' + e.message);
    }
}

// ===== DEBUG: CHECK SHAREDARRAYBUFFER AVAILABILITY =====
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
