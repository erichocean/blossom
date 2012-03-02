Blossom - Modern, Cross-Platform Application Framework
======================================================

**NEW!** Blossom 1.0.0-beta.1 was released on March 1, 2012.  Here's the 
release notes:

> Blossom's API and feature set are now stable enough to begin developing 
production applications with, and Blossom includes the latest Statechart and 
Datastore code from SproutCore 1.8.

> This is an early beta for experienced SproutCore developers targeting the 
latest releases of the Google Chrome and Apple Safari desktop web browsers. 
The public API is 99.9% stable (the only breaking changes going forward will 
be to accommodate bug fixes).

> Only Blossom's application framework differs from SproutCore in terms of 
the public API (the foundation and datastore frameworks remain unchanged), so 
the vast majority of your existing knowledge re: how to write SproutCore apps 
still applies.

> Note: Print-to-PDF support is missing, although Blossom's drawing model 
does support it correctly, so any SC.View and/or SC.Layer drawing code you 
write today will be supported when Print-to-PDF is enabled in a future 
release.

Blossom extends the reach of traditional SproutCore applications beyond the
web browser by re-architecting the view layer to be HTML and CSS-independent.

Blossom also extends the kinds of apps that can be written in JavaScript by 
implementing an easy-to-use, high-performance animation subsystem that 
leverages hardware acceleration on the GPU whenever possible. The API is 
roughly based on Apple's Core Animation framework, and provides similar 
capabilities -- even in modern web browsers.

Since SproutCore's HTML and CSS dependencies were removed, Blossom can 
support native runtimes on the desktop (Windows, Mac OS X, and Linux) and on 
mobile devices (iOS, Android, and Windows Phone) and tablets (iOS, Android) 
-- and that's in addition to modern web browsers, all with the same API.

Blossom's native runtimes are not "WebView" wrappers like PhoneGap or 
Cappuccino's poorly named "NativeHost". A "WebView" wrapper simulates a web 
browser inside of a native, double-clickable app, so the performance is just 
as poor on mobile devices and tablets as a web app running in a mobile 
browser is today. (In many cases, it's substantially worse.)

Blossom is different: instead of simulating a web browser, Blossom's native
runtime has high-performance, platform-native implementations of the various 
Blossom and SproutCore classes, such as SC.Request (for networking), SC.Layer 
(for animation), as well as the various JavaScript runtime objects such as 
CanvasRenderingContext2D, Float32Array and ArrayBuffer that are exposed to
Blossom developers. This is similar to Node.js, another JavaScript 
runtime based around Google v8 that also does not support HTML or CSS.

One of Blossom's key innovations is its drawing model, which is modeled after 
Mac OS X's "Quartz 2D" API. This PDF-compatible drawing model is used for all 
of Blossom's native views. Most importantly, drawing is GPU-accelerated even 
on mobile devices, and views draw identically on every host, including 
modern web browsers. This feature alone eliminates one of SproutCore's 
long-standing problem areas: quickly creating custom views that render fast.

Blossom is a *modern* application framework especially well-suited to apps 
running full screen on tablets and mobile devices, with rich animation and 
effects. In addition, modern operating systems including Mac OS X 10.7 and 
Windows 8 have moved strongly towards full-screen, single-window, immersive 
applications with heavy use of animation. This app model is also compatible 
with Blossom's capabilities when running in a modern web browser, making a 
Blossom app feel at home in all of these environments.

Blossom's developer tools run on Node.js, and Blossom is licensed under the 
GPLv3 for non-commercial use; commercial licenses will be available soon from 
Fohr under terms similar to what Sencha offers for Ext.js.

Getting Involved
----------------

* Why Blossom exists: http://bit.ly/future-of-sproutcore
* IRC Channel: #blossom on irc.freenode.net
* Want to give Blossom a spin? https://github.com/fohr/blossom-testproject
* Questions? Use [stackoverflow.com](http://stackoverflow.com/) and the *blossom* tag.

Watch this repository on GitHub to follow development, or fork it and submit 
a pull request to help contribute to it's evolution.

Blossom was conceived and written by Erich Ocean at Fohr <eocean@fohr.com>,
and is based on the SproutCore version 1.4.5 release.
