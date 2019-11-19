const moduleA = require('./moduleA');
const moduleB = require('./moduleB');
module.exports = {
    state: {
        a: 1
    },
    modules: {
        moduleA,
        moduleB
    }
}
