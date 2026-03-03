# RSDK-Library

**RSDK-Library** is a collection of WebAssembly ports of the [RSDKModding](https://github.com/RSDKModding) Decompilations.

## Settings
The settings page currently provides two options:
- **Enable Plus DLC:** Enables Plus DLC on supported engines (v3, v4, and v5/U). Disabled by default.
- **Device Profile:** Changes how the engine behaves. Desktop will act like a PC build of RSDK, Mobile - well, you get it. Desktop by default.

## Known Issues

#### Website
- Uploading files *might* hang. Give it some time before trying to reload the page

#### Engines

- The speed of the engines might be inaccurate to the settings.ini configuration. For now, just lower your refresh rate™️
- The engine might freeze when hiding the toolbar on safari
- Touch coordinates may be inaccurate if the canvas' size is not perfectly scaled
- [RSDKv5/U Specific] The engine(s) might fail to start if you are on an older browser, mobile browser, or if the site is hosted over http instead of https 
- [RSDKv5/U Specific] Native ModAPI probably won't work. Fine for legacy games though