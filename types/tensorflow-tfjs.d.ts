// @tensorflow/tfjs's package.json "main" points at a Node build with no
// adjacent .d.ts, which TS's "bundler" resolution picks over the "types"
// field. Declaring the module here (rather than fighting resolution config)
// keeps lib/teachableMachine.ts's own exported types precise while treating
// the tfjs API surface itself as untyped, which is what we get anyway.
declare module "@tensorflow/tfjs";
