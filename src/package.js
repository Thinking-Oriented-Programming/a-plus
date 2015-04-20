Package.describe({
  name: 'ericwangqing:a-plus',
  version: '0.0.1_3',
  // Brief, one-line summary of the package.
  summary: 'an alternative solution of router based app, state-machine based Single Page Application',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Thinking-Oriented-Programming/a-plus.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  // Jquery as a weak dependency, only if it's present, should load before a-plus
  // api.use('aramk:requirejs');
  api.use('jquery', 'client', {weak: true});
  api.use('ericwangqing:simple-requirejs@0.0.3');
  api.addFiles([
    'util.js',
    'state/abstract-state.js',
    'state/object-state.js',
    'state/array-state.js',
    'state/state.js',
    'state/transition.js',
    'state/state-machine.js',
    'ui/abstract-widget.js'
  ]);
});

Package.onTest(function(api) { 
  api.use('tinytest');
  api.use('ericwangqing:a-plus');
});
