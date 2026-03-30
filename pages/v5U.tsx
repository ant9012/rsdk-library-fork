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
    // --- Console State ---
    const [showConsole, setShowConsole] = React.useState(false);
    const [logs, setLogs] = React.useState<string[]>([]);
    const [input, setInput] = React.useState('');
    const endOfLogsRef = React.useRef<HTMLDivElement>(null);

    // --- Console Setup & Interception ---
    React.useEffect(() => {
        // Intercept console.log to push to our UI console
        const originalLog = console.log;
        console.log = (...args) => {
            // Convert objects to strings so they render nicely
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
            setLogs((prev) => [...prev, message]);
            originalLog(...args); // Keep logging to the actual browser console
        };

        // Toggle console with the Backtick (`) key
        const handleKeyDown = (e: KeyboardEvent) => {
            // e.code === 'Backquote' targets the physical key, ignoring Shift/layout weirdness
            if (e.code === 'Backquote' || e.key === '`' || e.key === '~') {
                e.preventDefault();
                e.stopPropagation(); // Stop the engine from seeing this keypress
                
                setShowConsole((prev) => !prev);
            }
        };

        // { capture: true } forces this listener to fire BEFORE the canvas intercepts it
        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            console.log = originalLog;
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, []);

    // Auto-scroll to bottom of console when new logs arrive
    React.useEffect(() => {
        if (showConsole && endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, showConsole]);

    // Handle pressing Enter in the console input
    const handleCommandSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim() !== '') {
            // Echo the command to the logs
            setLogs((prev) => [...prev, `> ${input}`]);

            // TODO: Wire up your RSDKv5U / Engine command parsing here
            // Example: if (input === 'godmode') { enableGodMode(); }

            setInput('');
        }
    };

    // --- Engine FS ---
    // this is stupid.
    React.useEffect(() => {
        // @ts-ignore - Ignoring if TS complains about window augmentation
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
                console.error("FS Init Error:", error);
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

                    {/* --- Console Overlay --- */}
                    {showConsole && (
                        <div 
                            className="engine-console"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '40%',
                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                color: '#00ff00',
                                fontFamily: 'monospace',
                                zIndex: 9999, // Ensure it sits above the canvas/splash
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                                {logs.map((log, index) => (
                                    <div key={index} style={{ wordBreak: 'break-all' }}>{log}</div>
                                ))}
                                <div ref={endOfLogsRef} />
                            </div>
                            
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleCommandSubmit}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderTop: '1px solid #00ff00',
                                    color: '#00ff00',
                                    outline: 'none',
                                    paddingTop: '10px',
                                    fontFamily: 'monospace'
                                }}
                                placeholder="Enter command..."
                                autoFocus
                            />
                        </div>
                    )}
                </ThemeProvider>

                <Script src='coi-serviceworker.js' />
                <Script src='./lib/RSDKv5U.js' />
                <Script src='./modules/RSDKv5U.js' />
            </div>
        </>
    )
}
