'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

// --------------------
// UI Component Imports
// --------------------

import Head from 'next/head'
import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

// ---------------
// Library Imports
// ---------------

import EngineFS from '@/lib/EngineFS'

// ---------------------
// Component Definitions
// ---------------------

export default function V5U() {
    // We use a ref instead of state so updating logs doesn't re-render the canvas!
    const consoleRef = React.useRef<HTMLDivElement>(null);

    // --- Console Setup & Interception ---
    React.useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        // Helper to manually inject log lines into the DOM without React state
        const appendLog = (msg: string, color: string) => {
            if (consoleRef.current) {
                const line = document.createElement('div');
                line.style.color = color;
                line.style.wordBreak = 'break-all';
                line.textContent = msg;
                consoleRef.current.appendChild(line);
                
                // Auto-scroll
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };

        console.log = (...args) => {
            originalLog(...args);
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
            appendLog(message, '#00ff00'); // Green for standard logs
        };

        console.warn = (...args) => {
            originalWarn(...args);
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
            appendLog(message, '#ffff00'); // Yellow for warnings
        };

        console.error = (...args) => {
            originalError(...args);
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
            appendLog(message, '#ff0000'); // Red for errors
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    // --- Engine FS ---
    // this is stupid.
    React.useEffect(() => {
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error: any) {
                // Check if this is just Emscripten's expected infinite loop halt
                if (error === 'unwind' || String(error).includes('unwind') || (error && error.name === 'ExitStatus')) {
                    console.log("Engine successfully yielded to the browser event loop.");
                } else {
                    console.error("FS Init Error:", error);
                }
            }
        };
    }, []);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            
            <div className='enginePage' style={{ position: 'relative' }}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash/>
                    <canvas className='engineCanvas' id='canvas' />

                    {/* --- Passive Console Overlay --- */}
                    <div 
                        ref={consoleRef}
                        className="engine-console"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '40vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            zIndex: 2147483647,
                            overflowY: 'auto',
                            padding: '1rem',
                            boxSizing: 'border-box',
                            pointerEvents: 'none' // CRITICAL: Lets clicks pass through to the game
                        }}
                    />
                </ThemeProvider>

                <Script src='coi-serviceworker.js' />
                <Script src='./lib/RSDKv5U.js' />
                <Script src='./modules/RSDKv5U.js' />
            </div>
        </>
    )
}
