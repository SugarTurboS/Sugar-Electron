const moduleA = require('./moduleA');
const moduleB = require('./moduleB');
module.exports = {
    state: {
        a: 'a',
        A: 'A'
    },
    modules: {
        moduleA,
        moduleB
    }
}
