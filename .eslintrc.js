module.exports = {
  extends: "airbnb-base",
  rules: {
    'comma-dangle': 0,
    quotes: 0,
    'new-cap': 0,
    'eol-last': 0,
    'global-require': 0,
    'no-plusplus': 0,
    'no-mixed-operators': 0,
    'no-underscore-dangle': 0,
    'class-methods-use-this': 0,
    'no-unused-expressions': [2, {
      allowShortCircuit: true,
      allowTernary: true
    }],
    'no-param-reassign': [2, {
      props: false
    }],
    "import/no-extraneous-dependencies": ["error", {
      "devDependencies": ['**/tests/**/*.js'],
    }],
    "arrow-body-style": 0,
    "space-before-function-paren": 0,
    "arrow-parens": 0,
    "prefer-template": 0,
    "one-var": 0,
    "linebreak-style": 0,
    "no-else-return": 1,
    "brace-style": 0,
    "dot-notation": 1,
    "no-trailing-spaces": 1,
    "consistent-return": 1,
    "no-unused-vars": 1,
    "no-return-assign": 0,
    "max-len": 1,
    "no-continue": 1
    
  },
  plugins: [
    // "react"
  ]
};
