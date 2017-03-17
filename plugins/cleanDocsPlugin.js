var util = require('util');
var fs = require('fs');

exports.register = function() {
    var plugin = this;

    plugin.logdebug('************* cleanDocs-plugin ********');
    plugin.register_hook('queue', 'debugQueue');
    plugin.register_hook('rcpt',    'my_rcpt');
    plugin.register_hook('mail',    'my_mail', -99);
};

exports.debugQueue = function(next, connection, params) {
    var plugin = this;
    var txn = connection.transaction;
    plugin.logdebug('************* cleanDocs-plugin.debugQueue ********', connection);
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
       plugin.logdebug('************* cleanDocs-plugin.my_rcpt********', connection);
       return next();
};

exports.my_mail = function (next, connection, params) {
    var plugin = this;
    var hook_name = connection.hook; // rcpt or rcpt_ok

    // do processing
       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('************ cleanDocs-plugin.my_mail********', connection);
       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('From Address: ' + params[0], connection);
       return next();
};

exports.hook_data = function (next, connection) {
    var plugin = this;
    // enable mail body parsing
    plugin.logdebug('*********************************************', connection);
    plugin.logdebug('********* cleanDocs-plugin.hook_data ********', connection);
    plugin.logdebug('*********************************************', connection);
    connection.transaction.parse_body = 1;
    connection.transaction.attachment_hooks(
        // This will be called for every attachment.
        // TODO Need to add logic to clean the attachments and then re-attach to the email
        function (ct, fn, body, stream) {
            start_att(connection, ct, fn, body, stream)
        }
    );
    // Add sample test header to the email.
    connection.transaction.header.header_list.push("cleandocs-addin: smtp_relay_server\n");
    next();
}

function start_att(connection, ct, fn, body, stream) {
    connection.loginfo("start_att, called");
    var content_type = stream.header.headers_decoded["content-type"];
    connection.loginfo("Content type: " + content_type);
    var elems = content_type[0].split(";");

    var fileName = elems[1].split("=")[1];
    fileName = fileName.replace(/['"]+/g, '');
    connection.loginfo("Attachment name: " + fileName);
    
    stream.connection = connection; // Allow backpressure
    stream.pause();

    var wstream = fs.createWriteStream(fileName);
    stream.pipe(wstream);
    stream.resume();
    wstream.on('close', function () {
        connection.loginfo("End of stream reached");
        fs.stat(fileName, function (err, stats) {
            connection.loginfo("Got data of length: " + stats.size);
            // Close the file
            wstream.close();
           // connection.transaction.notes.attachment_count--;
            connection.loginfo("*** starting cleanDocs... ideally calling an API");

            
           // const spawn = require('child_process').spawn;
           // const bat = spawn('C:\\Program Files (x86)\\DocsCorp\\cleanDocs\\cleanDocs.exe', ['-i', fileName, '-o', 'cleanded_' + fileName, '-q']);

           /* bat.stdout.on('data', (data) => {
                connection.loginfo(data.toString());
            });

            bat.stderr.on('data', (data) => {
                connection.loginfo(data.toString());
            });

            bat.on('exit', (code) => {
                connection.loginfo(`clean completed: ${code}`);
            });*/
        });
    });
}
