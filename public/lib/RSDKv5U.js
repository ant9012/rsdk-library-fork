function enforceIntegerScaling() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const baseWidth = 424; 
    const baseHeight = 240; 

    // Force strict whole-number multipliers to prevent Moiré bands
    const scaleX = Math.floor(window.innerWidth / baseWidth);
    const scaleY = Math.floor(window.innerHeight / baseHeight);
    const scale = Math.max(1, Math.min(scaleX, scaleY)); 

    canvas.style.width = (baseWidth * scale) + 'px';
    canvas.style.height = (baseHeight * scale) + 'px';
    canvas.style.imageRendering = 'pixelated'; 

    // Pin it dead center
    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

document.body.style.backgroundColor = 'black'; 
document.body.style.margin = '0';
document.body.style.overflow = 'hidden'; 

window.addEventListener('resize', enforceIntegerScaling);

var Module = {
    noInitialRun: true,
    // We are back to your original, safe initialization phase
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv5U',
            function () {
                console.log('EngineFS initialized');
                const splash = document.getElementById("splash");
                if (splash) {
                    splash.style.opacity = 0;
                    setTimeout(() => { splash.remove(); }, 1000);
                }
                
                // Files are fully loaded. Let's configure and boot!
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
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", (e) => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
        enforceIntegerScaling();
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

        if (m) {
            text = m[1];
        }

        console.log(text);
    },
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
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
    // 1. Step into the folder populated by your IndexedDB setup
    FS.chdir('/RSDKv5U');

    // 2. Load configurations
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        _RSDK_Configure(settings.enablePlus, 0);
    }

    // 3. Initialize the Engine API
    _RSDK_Initialize();

    // 4. THE CRITICAL FIX: Manually invoke the C++ main() function 
    // now that we are 100% sure the files exist and the path is correct.
    Module.callMain();
}
