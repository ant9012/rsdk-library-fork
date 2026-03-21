'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'
import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'
import EngineFS from '@/lib/EngineFS'

export default function V4() {
    const consoleRef = useRef<HTMLTextAreaElement>(null);
    const [isVisible, setIsVisible] = useState(true);

    // ---------------------------------------------------------
    // 1. Console & Error Interception Hook
    // ---------------------------------------------------------
    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        const appendToVirtualConsole = (type: string, args: any[]) => {
            if (consoleRef.current) {
                const message = args.map(arg => {
                    try {
                        if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`;
                        return (typeof arg === 'object') ? JSON.stringify(arg) : String(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }).join(' ');

                const timestamp = new Date().toLocaleTimeString().split(' ')[0];
                const line = `[${timestamp}] [${type}] ${message}\n`;

                consoleRef.current.value += line;
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };

        // --- A. Override Console Methods ---
        console.log = (...args) => { originalLog.apply(console, args); appendToVirtualConsole('LOG', args); };
        console.warn = (...args) => { originalWarn.apply(console, args); appendToVirtualConsole('WRN', args); };
        console.error = (...args) => { originalError.apply(console, args); appendToVirtualConsole('ERR', args); };
        console.info = (...args) => { originalInfo.apply(console, args); appendToVirtualConsole('INF', args); };

        // --- B. Catch Global Crashes (Syntax Errors, Wasm Crashes) ---
        const handleGlobalError = (event: ErrorEvent) => {
            const msg = event.error ? (event.error.stack || event.error.message) : event.message;
            appendToVirtualConsole('CRASH', [msg]);
            // return false to let the error propagate to the browser console too
            return false;
        };

        // --- C. Catch Unhandled Promises (Async Errors) ---
        const handleRejection = (event: PromiseRejectionEvent) => {
            appendToVirtualConsole('PROMISE', [event.reason]);
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleRejection);

        // --- D. Check for Pthread Support (Common Issue) ---
        if (typeof SharedArrayBuffer === 'undefined') {
            appendToVirtualConsole('CRITICAL', ["SharedArrayBuffer is NOT defined. The game will fail to load."]);
            appendToVirtualConsole('HINT', ["Ensure 'coi-serviceworker.js' is loaded and headers (COOP/COEP) are set."]);
        }

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.info = originalInfo;
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    // ---------------------------------------------------------
    // 2. FileSystem Initialization Hook
    // ---------------------------------------------------------
    useEffect(() => {
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            console.log("Initializing FileSystem...");
            try {
                await EngineFS.Init(p);
                console.log("FileSystem Initialized.");
                f();
            } catch (error) {
                console.error("FS Init Failed:", error);
            }
        };
    }, []);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            
            <div className='enginePage' style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'black' }}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    
                    <canvas 
                        id='canvas' 
                        className='engineCanvas' 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, display: 'block' }} 
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
                        <Splash/>
                    </div>

                    <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '25vh', 
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', borderTop: '2px solid #333', zIndex: 9999, 
                        display: isVisible ? 'flex' : 'none', flexDirection: 'column' 
                    }}>
                        <div style={{ padding: '5px 10px', backgroundColor: '#222', color: '#fff', fontSize: '11px', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
                            <span>DEBUG CONSOLE</span>
                            <button onClick={() => setIsVisible(false)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#ff5555' }}>[X]</button>
                        </div>
                        <textarea 
                            id="output" 
                            ref={consoleRef}
                            readOnly
                            spellCheck={false}
                            style={{
                                flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent', color: '#00ff00', 
                                fontFamily: 'Consolas, monospace', fontSize: '13px', border: 'none', resize: 'none', outline: 'none', padding: '10px'
                            }}
                        />
                    </div>

                    {!isVisible && (
                        <button onClick={() => setIsVisible(true)} style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 9999, padding: '5px 10px', backgroundColor: '#222', color: '#00ff00', border: '1px solid #00ff00', fontFamily: 'monospace', cursor: 'pointer' }}>SHOW CONSOLE</button>
                    )}

                </ThemeProvider>

                <Script src='coi-serviceworker.js' strategy="beforeInteractive" />

                
                <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
            </div>
        </>
    )
}
