# User Group Talk

## Why does Blossom exist?

- A brief history of views in SproutCore
  - Cappuccino's influence
  - templates (0.9, Ruby) -> javascript (1.0) -> templates (SC 2)
  - IE 7 and DOM performance
  
- Why are SproutCore views so dang hard to write?
  - HTML and CSS play off each other (no central way to style)
  - surprising interplay between unrelated views
  - lots of CSS is a pain (conflicts, !important, very long selectors)
  - very, very hard to subclass an existing view due to styling issues

- SproutCore sucks on mobile IMO
  - the code itself takes a long time to parse (not to mention download)
  - touch events in mobile browser are pretty hacky
  - the framework as a whole is structured in a way that makes good mobile hard

- The world is different now than in 2008
  - browsers are better
  - native apps are huge on mobile (hello, iPhone!)
  - a massive shift towards single-window and/or full screen apps
    - iOS is 100% full screen
    - Mac OS X Lion is heavily promoting full screen apps
    - and so is Windows 8

## What are the primary goals for Blossom?

- Modern
  - Node.js-based buildtools
  - awesome animation support
  - statecharts should work well everywhere, not be an add-on
- Cross-platform
  - we love the browser, but native is where it's at
  - want both, at the same time
  - WebView wrappers suck
    - crappy performance
    - weird resource problems that can't be overcome
    - admit it: it's a hack
- Kick ass on mobile/touch devices
  - native runtimes
  - native graphics implementations
  - must us the GPU for mobile
- __Fix the view problem__
  - views should be easy to write and style
  - subclassing a view should be easy
  - styling one view shouldn't hurt another view
  - you shouldn't need deep knowledge of browser runtimes and DOM 
    implementations to get good performance

## Code walkthrough, demos

- framework organization
- buildtools
  - based on the npm infrastructur
  - demo: test_project
- theory of supporting multiple platforms (ifdefs)

## Blossom Developer Preview

- what works today
  - demos!
  - layer and view model
    - gpu
    - compositing
    - animation with the animation loop
- code walkthrough of SC.Layer and ext/float32.js
  - give a flavor of how things look under the hood
- what you can do now
- how you can help going forward
  - subclass SC.Pane (and soon, SC.View) with new controls
    - from each theme: Classic, Ace, and Aristo
  - extend the buildtools with new npm packages people can use
    (BT.ClassicProject would be great)
  - encouragement!
