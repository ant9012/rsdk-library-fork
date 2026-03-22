'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'
import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'
import EngineFS from '@/lib/EngineFS'

export default function V4() {
    const [isReady, setIsReady] = useState(false);
    const consoleRef = useRef<HTMLTextAreaElement>(null);

    // 1. Console Hook
    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const logToScreen = (type: string, msg: string) => {
            if (consoleRef.current) {
                consoleRef.current.value += `[${type}] ${msg}\n`;
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };
        console.log = (...args) => { originalLog.apply(console, args); logToScreen("LOG", args.join(' ')); };
        console.error = (...args) => { originalError.apply(console, args); logToScreen("ERR", args.join(' ')); };
    }, []);

    // 2. Security Gate
    useEffect(() => {
        if (window.crossOriginIsolated) {
            console.log("Environment Secure (COOP/COEP Active).");
            setIsReady(true);
        } else {
            console.log("Environment Insecure. Registering Service Worker...");
        }
    }, []);

    // 3. FileSystem Hook (WITH TIMEOUT FIX)
    useEffect(() => {
        if (!isReady) return;
        
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            console.log("Initializing FileSystem...");

            // Create a 3-second timeout to detect deadlocks
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000));
            
            try {
                // Race the FS Init against the timeout
                const result = await Promise.race([
                    EngineFS.Init(p).then(() => 'success'),
                    timeoutPromise
                ]);

                if (result === 'timeout') {
                    console.error("FS Init Timed Out (Pthread Deadlock detected). Skipping FS...");
                    // Force the game to start without FS
                    f(); 
                } else {
                    console.log("FileSystem Ready.");
                    f(); // Start game normally
                }
            } catch (error) {
                console.error("FS Error:", error);
                f(); // Try to start anyway
            }
        };
    }, [isReady]);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            <div className='enginePage' style={{position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black'}}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    
                    <Script src='coi-serviceworker.js' strategy="beforeInteractive" />

                    {isReady ? (
                        <>
                            <canvas id='canvas' className='engineCanvas' style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block'}} onContextMenu={(e)=>e.preventDefault()} />
                            <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}><Splash/></div>
                            
                            {/* Make sure paths match where you put files in public/ */}
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        <div style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <h2>Enabling High Performance Mode...</h2>
                        </div>
                    )}

                    <textarea ref={consoleRef} style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: 'rgba(0,0,0,0.8)', color: 'lime', border: 'none', zIndex: 9999}} readOnly />

                </ThemeProvider>
            </div>
        </>
    )
}
