var util = require('util');
exports.register = function() {
    var plugin = this;

    plugin.logdebug('************* SESHUTESTPLUGIN ********');
    plugin.register_hook('queue', 'debugQueue');
    plugin.register_hook('rcpt',    'my_rcpt');
    plugin.register_hook('mail',    'my_mail', -99);
};

exports.debugQueue = function(next, connection, params) {
    var plugin = this;
    var txn = connection.transaction;
    plugin.logdebug('************* SESHUTESTPLUGIN ********', connection);
    plugin.loginfo(util.inspect(connection));
    plugin.loginfo(util.inspect(txn));
    plugin.loginfo(util.inspect(txn.mail_from));
    plugin.loginfo(util.inspect(txn.rcpt_to));
    plugin.loginfo(util.inspect(txn.header.headers_decoded));
    next();
};

exports.my_rcpt = function (next, connection, params) {
    var plugin = this;
    var hook_name = connection.hook; // rcpt or rcpt_ok
    // email address is in params[0]
    // do processing
       plugin.logdebug('************* SESHUTESTPLUGIN my_rcpt********', connection);
};

exports.my_mail = function (next, connection, params) {
    var plugin = this;
    var hook_name = connection.hook; // rcpt or rcpt_ok
    // email address is in params[0]
    // do processing

       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('************* SESHUTESTPLUGIN my_mail********', connection);
       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('Address: ' + params[0], connection);
       return next();
};

