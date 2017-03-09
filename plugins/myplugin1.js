var util = require('util');
var fs = require('fs');

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
       return next();
};

exports.my_mail = function (next, connection, params) {
    var plugin = this;
    var hook_name = connection.hook; // rcpt or rcpt_ok
    // email address is in params[0]
    // do processing

       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('************* SESHUTESTPLUGIN my_mail********', connection);
       plugin.logdebug('*********************************************', connection);
       plugin.logdebug('From Address: ' + params[0], connection);
       return next();
};

exports.hook_data = function (next, connection) {
    // enable mail body parsing
    connection.transaction.parse_body = 1;
    connection.transaction.attachment_hooks(
        function (ct, fn, body, stream) {
            start_att(connection, ct, fn, body, stream)
        }
    );
    next();
}

function start_att(connection, ct, fn, body, stream) {
    //connection.loginfo("Got attachment: " + ct + ", " + fn + " for user id: " + connection.transaction.notes.hubdoc_user.email);
    connection.loginfo("start_att, called");
    connection.transaction.notes.attachment_count++;
    var content_type = stream.header.headers_decoded["content-type"];
    connection.loginfo("Content type: " + content_type);
    var elems = content_type[0].split(";");

    var fileName = elems[1].split("=")[1];
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

            connection.loginfo("*** starting cleanDocs... ");
            const spawn = require('child_process').spawn;
            const bat = spawn('C:\\Program Files (x86)\\DocsCorp\\cleanDocs\\cleanDocs.exe', ['-i', fileName, '-o', 'cleanded_' + fileName, '-q']);

            bat.stdout.on('data', (data) => {
                connection.loginfo(data.toString());
            });

            bat.stderr.on('data', (data) => {
                connection.loginfo(data.toString());
            });

            bat.on('exit', (code) => {
                connection.loginfo(`clean completed: ${code}`);
            });
        });
    });

    /*var tmp = require('tmp');

    tmp.file(function (err, path, fd) {
        connection.loginfo("Got tempfile: " + path + " (" + fd + ")");
        var ws = fs.createWriteStream(path);
        stream.pipe(ws);
        stream.resume();
        ws.on('close', function () {
            connection.loginfo("End of stream reached");
            fs.fstat(fd, function (err, stats) {
                connection.loginfo("Got data of length: " + stats.size);
                // Close the tmp file descriptor
                fs.close(fd, function () { });
            });
        });
    });*/
}
