'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'
import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'
import EngineFS from '@/lib/EngineFS'

export default function V4() {
    const [isReady, setIsReady] = useState(false);

    // 1. Security Gate (Required for Pthreads / SharedArrayBuffer)
    useEffect(() => {
        if (window.crossOriginIsolated) {
            console.log("Environment Secure (COOP/COEP Active).");
            setIsReady(true);
        } else {
            console.log("Environment Insecure. Waiting for Service Worker Reload...");
        }
    }, []);

    // 2. FileSystem Hook (With Pthread Ready Wait)
    useEffect(() => {
        if (!isReady) return;
        
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            // Wait for Pthread pool to fully initialize to prevent FS.syncfs deadlocks
            await new Promise(resolve => setTimeout(resolve, 500));

            // @ts-ignore
            if (typeof IDBFS === 'undefined') {
                console.error("IDBFS is UNDEFINED. Build is missing -lidbfs.js flag!");
                f();
                return;
            }

            try {
                await EngineFS.Init(p);
                console.log("FileSystem Ready.");
                f();
            } catch (error) {
                console.error("FS Error:", error);
                f(); // Start game anyway even if FS fails
            }
        };
    }, [isReady]);

        // Unlock Web Audio on first user interaction
    useEffect(() => {
        const unlockAudio = () => {
            // Emscripten exposes the AudioContext via the Module object
            // @ts-ignore
            if (window.Module && window.Module.SDL2 && window.Module.SDL2.audioContext) {
                // @ts-ignore
                const audioCtx = window.Module.SDL2.audioContext;
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().then(() => {
                        console.log("AudioContext resumed successfully.");
                    });
                }
            } else {
                // Fallback standard web audio unlock
                // @ts-ignore
                if (window.SDL && window.SDL.audioContext && window.SDL.audioContext.state === 'suspended') {
                     // @ts-ignore
                     window.SDL.audioContext.resume();
                }
            }
        };

        // Listen for any interaction
        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

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
                            <canvas 
                                id='canvas' 
                                className='engineCanvas' 
                                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block'}} 
                                onContextMenu={(e)=>e.preventDefault()} 
                            />
                            
                            {/* Added id="splash" so RSDKv4.js can find and fade it out */}
                            <div id="splash" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transition: 'opacity 1s ease'}}>
                                <Splash/>
                            </div>
                            
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        <div style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <h2>Enabling High Performance Mode...</h2>
                            <p style={{color: '#888'}}>Reloading to enable Pthreads</p>
                        </div>
                    )}

                </ThemeProvider>
            </div>
        </>
    )
}
