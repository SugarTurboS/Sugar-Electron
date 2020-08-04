const moduleA = require('./moduleA');
const moduleB = require('./moduleB');
module.exports = {
    state: {
        a: 1,
        A: 2
    },
    modules: {
        moduleA,
        moduleB
    }
}
